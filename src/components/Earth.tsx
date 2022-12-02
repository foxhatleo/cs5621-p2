import React, {useCallback, useEffect, useRef, useState} from "react";
import Globe, {GlobeMethods} from "react-globe.gl";
import {StateVector} from "../data/AllFlights";
import * as THREE from "three";
import {Sprite} from "three";
import AirportsData from "../data/AirportsData";
import {DetailedStateVector} from "../data/DetailedFlightData";

/**
 * Get viewport sizes.
 */
const viewportSize = () => {
  const w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  const h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [w, h];
};

const YELLOW_AIRPLANE = new THREE.TextureLoader().load("https://i.imgur.com/bb4rqmb.png");
const GREEN_AIRPLANE = new THREE.TextureLoader().load("https://i.imgur.com/WRLjUEG.png");

export type EarthProps = {
  stateVectors: StateVector[];
  selected: DetailedStateVector | null;
  setSelected: (v: number) => void;
  selecting: boolean;
};

/**
 * The earth.
 */
const Earth: React.ComponentType<EarthProps> = (p) => {
  /** Reference of globe. */
  const myGlobe = useRef<GlobeMethods>();
  /** Size states. */
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [globeRadius, setGlobeRadius] = useState<number>(0);
  /** Reference of the list of sprites for all airplanes. */
  const spriteRefs = useRef<{ [icao24: string]: Sprite }>({});
  /** Data of the arc when a flight is selected. */
  const [arcData, setArcData] = useState<null | THREE.Vector3[][]>(null);
  /** A flag to help keep track when user interacts with the globe. */
  const clearSelectionFlag = useRef<boolean>(false);

  // This hook handles resizing and globe initialization.
  useEffect(() => {
    if (!myGlobe.current) return;
    myGlobe.current.controls().minDistance = 150;
    myGlobe.current.controls().maxDistance = 330;
    myGlobe.current.controls().zoomSpeed = 5;
    setWidth(viewportSize()[0]);
    setHeight(viewportSize()[1]);

    const resizeHandler = () => {
      setWidth(viewportSize()[0]);
      setHeight(viewportSize()[1]);
    };
    window.addEventListener("resize", resizeHandler);

    setGlobeRadius(myGlobe.current?.getGlobeRadius() || 0);
    myGlobe.current?.pointOfView({altitude: 3.5});

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // This generates 3D objects for planes.
  const planeObjGenerator = useCallback((data_untyped: unknown): any => {
    const data = data_untyped as StateVector;
    if (!globeRadius) return undefined;
    const material = new THREE.SpriteMaterial(
      {
        map: p.selecting && data.icao24 === p.selected?.icao24 ? GREEN_AIRPLANE : YELLOW_AIRPLANE,
        rotation: data.true_track ? -1 * (data.true_track * (Math.PI / 180)) : 0
      });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 2);
    spriteRefs.current[data.icao24] = sprite;
    return sprite;
  }, [p.stateVectors, p.selected, p.selecting]);

  /** Handler for selecting a plane. */
  const onSelect = (obj_untyped: unknown) => {
    const obj = obj_untyped as StateVector;
    const ind = p.stateVectors.indexOf(obj);
    if (ind === -1) {
      console.error("On select received an unknown object.");
      return;
    }
    console.log(`Select ind ${ind}.`);
    p.setSelected(ind);
  };

  /** Generate points for the arc. */
  function arc(d: any) {
    const s = myGlobe?.current!.getCoords(d.source_lat, d.source_lng, d.source_alt);
    const source = new THREE.Vector3(s.x, s.y, s.z);
    const t = myGlobe?.current!.getCoords(d.target_lat, d.target_lng, d.target_alt);
    const target = new THREE.Vector3(t.x, t.y, t.z);
    const globe = new THREE.Vector3(0, 0, 0);

    const center = globe;
    const radius = target.distanceTo(globe);

    const p = new Array(d.points).fill(null).map((_, i) => i + 1);
    let points = p.map((x) => {
      const temp = target.clone().sub(source).multiplyScalar(x / d.points).add(source);
      return center.clone().add(temp.clone().sub(center).normalize().multiplyScalar(radius));
    });

    if (points[points.length - 1].angleTo(source) < Math.PI / 30) {
      points = [points[points.length - 1]];
    } else {
      for (let i = 0; i < points.length; i++) {
        if (points[i].angleTo(source) >= Math.PI / 30) {
          points = points.slice(i);
          break;
        }
      }
    }

    const intermediate = points[0];
    const vec = intermediate.clone().sub(source);
    const normal = vec.clone();
    const midpoint = vec.clone().multiplyScalar(0.5).add(source);
    const opposite_source = globe.clone().add(globe.clone().add(source.clone().multiplyScalar(-10)));
    const small_r = source.clone().add(
      (
        opposite_source.clone().sub(source).multiplyScalar(
          normal.dot(midpoint.clone().sub(source)) /
          normal.dot(opposite_source.clone().sub(source))
        )
      )
    );
    const r_1 = midpoint.clone().add(midpoint.clone().sub(small_r));
    const radius_1 = r_1.distanceTo(source);

    const p_1 = new Array(d.points).fill(null).map((_, i) => i + 1);
    const points_1 = p_1.map((x) => {
      const temp = vec.clone().multiplyScalar(x / d.points).add(source);
      return r_1.clone().add(temp.sub(r_1).normalize().multiplyScalar(radius_1));
    });

    points = points_1.concat(points);

    const points_pairs = points.map((x, i) => {
      if (i + 1 === points.length) {
        return [x, x];
      }
      return [x, points[i + 1]];
    });
    points_pairs.pop();
    return points_pairs;
  }

  // This hook handles arc generation when selection changes.
  useEffect(() => {
    if (!p.selected || !p.selecting) setArcData([]);
    else {
      const departureAirport = p.selected.estDepartureAirport;
      if (!departureAirport) {
        setArcData([]);
      } else {
        const adata = AirportsData[departureAirport];
        if (!adata) {
          setArcData([]);
          return;
        }
        const data = {
          source_lat: adata.lat,
          source_lng: adata.lon,
          source_alt: 0,
          target_lat: p.selected.latitude,
          target_lng: p.selected.longitude,
          target_alt: p.selected.artificial_altitude,
          points: 200,
        };
        setArcData(arc(data));
      }
    }
  }, [p.selected, p.selecting]);

  /** Function that draws the arc using points data. */
  const arcDrawer = useCallback((v: any) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(v);
    const material = new THREE.LineBasicMaterial({color: "green"});
    return new THREE.Line(geometry, material);
  }, []);

  const downHandler = () => {
    clearSelectionFlag.current = true;
  };
  const upHandler = () => {
    if (clearSelectionFlag.current) {
      clearSelectionFlag.current = false;
      p.setSelected(-1);
    }
  };

  const moveHandler = () => {
    clearSelectionFlag.current = false;
  };

  return (
    <div onMouseDown={downHandler} onMouseUp={upHandler} onMouseMove={moveHandler}>
      <Globe width={width}
        height={height}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        ref={myGlobe}
        objectAltitude="artificial_altitude"
        objectLat="latitude"
        objectLng="longitude"
        objectsData={p.stateVectors}
        objectThreeObject={planeObjGenerator}
        onObjectClick={onSelect}
        customLayerData={arcData ? arcData : []}
        customThreeObject={arcDrawer}
        customThreeObjectUpdate={(obj, d: any) => {
          const geometry = new THREE.BufferGeometry().setFromPoints(d);
          Object.assign(obj.position, geometry.attributes.position);
        }}
      />
    </div>
  );
};

export default Earth;
