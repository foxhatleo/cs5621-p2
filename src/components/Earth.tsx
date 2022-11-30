import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Globe, {GlobeMethods} from "react-globe.gl";
import {StateVector} from "../data/AllFlights";
import * as THREE from "three";
import {Sprite} from "three";
import {FlightsByAircraft} from "../data/FlightData";
import AirportsData from "../data/AirportsData";

const viewportSize = () => {
  const w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  const h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [w, h];
};

export type EarthProps = {
  flights: StateVector[];
  selectedFlightData: FlightsByAircraft | null;
  setSelected: (v: number) => void;
};

const yellow_map = new THREE.TextureLoader().load("https://i.imgur.com/bb4rqmb.png");
const green_map = new THREE.TextureLoader().load("https://i.imgur.com/WRLjUEG.png");

const Earth: React.ComponentType<EarthProps> = (p) => {
  const myGlobe = useRef<GlobeMethods>();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [globeRadius, setGlobeRadius] = useState<number>(0);
  const [selected, setSelected] = useState<number>(-1);

  useEffect(() => {
    if (!myGlobe.current) return;
    myGlobe.current.controls().minDistance = 200;
    myGlobe.current.controls().maxDistance = 330;
    myGlobe.current.controls().zoomSpeed = 5;
    setWidth(viewportSize()[0]);
    setHeight(viewportSize()[1]);

    const resizeHandler = () => {
      setWidth(viewportSize()[0]);
      setHeight(viewportSize()[1]);
    };
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const objectsData: (StateVector & { lat: number; lng: number; alt: number })[] = useMemo(() => p.flights.map((state, i) => ({
    ...state,
    lat: state.latitude!,
    lng: state.longitude!,
    alt: state.artificial_altitude
  })), [p.flights]);

  const spriteRefs = useRef<{ [icao24: string]: Sprite }>({});
  const selectedSpritRef = useRef<Sprite | null>(null);

  const satObject = useCallback((data_untyped: Object): any => {
    const data = data_untyped as typeof objectsData[0];
    if (!globeRadius) return undefined;
    const material = new THREE.SpriteMaterial(
      {
        map: selected === objectsData.indexOf(data) ? green_map : yellow_map,
        rotation: data.true_track ? -1 * (data.true_track * (Math.PI / 180)) : 0
      });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 2, 2);
    spriteRefs.current[data.icao24] = sprite;
    return sprite;
  }, [objectsData]);

  useEffect(() => {
    setGlobeRadius(myGlobe.current?.getGlobeRadius() || 0);
    myGlobe.current?.pointOfView({altitude: 3.5});
  }, []);

  const onSelect = (obj: any, event: MouseEvent) => {
    const ind = objectsData.indexOf(obj);
    if (ind === -1) {
      console.error("On select received an unknown object.");
      debugger;
    }
    setSelected(ind);
    console.log(`Select ind ${ind}.`);
    console.dir(obj);
    const sp = spriteRefs.current[(obj as StateVector).icao24];
    if (!sp) {
      console.error("Could not find sprite when selecting.");
      debugger;
    }
    sp.material.map = green_map;
    if (selectedSpritRef.current) {
      selectedSpritRef.current!.material.map = yellow_map;
    }
    selectedSpritRef.current = sp;
    p.setSelected(ind);
  };

  function arc(d: any) {
    const s = myGlobe?.current!.getCoords(d.source_lat, d.source_lng, d.source_alt);
    const source = new THREE.Vector3(s.x, s.y, s.z);
    const t = myGlobe?.current!.getCoords(d.target_lat, d.target_lng, d.target_alt);
    const target = new THREE.Vector3(t.x, t.y, t.z);
    const globe = new THREE.Vector3(0, 0, 0);

    const center = globe;
    const radius = target.distanceTo(globe);

    const p = new Array(d.points).fill(null).map((_, i) => i + 1);
    let points = p.map((x, _) => {
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
        opposite_source.clone().sub(source).multiplyScalar
        (
          normal.dot(midpoint.clone().sub(source)) /
          normal.dot(opposite_source.clone().sub(source))
        )
      )
    );
    const r_1 = midpoint.clone().add(midpoint.clone().sub(small_r));
    const radius_1 = r_1.distanceTo(source);

    const p_1 = new Array(d.points).fill(null).map((_, i) => i + 1);
    const points_1 = p_1.map((x, _) => {
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

  const [arcData, setArcData] = useState<null | THREE.Vector3[][]>(null);
  useEffect(() => {
    if (!p.selectedFlightData || (selected === -1)) setArcData([]);
    else {
      const departureAirport = p.selectedFlightData.estDepartureAirport;
      if (!departureAirport) {
        setArcData([]);
      } else {
        const adata = AirportsData[departureAirport];
        console.log(adata.state);
        console.log(adata.icao);
        const data = {
          source_lat: adata.lat,
          source_lng: adata.lon,
          source_alt: 0,
          target_lat: p.flights[selected].latitude,
          target_lng: p.flights[selected].longitude,
          target_alt: 0.06, // NEEDS TO BE CHANGED
          points: 200,
        };
        setArcData(arc(data));
      }
    }
  }, [selected]);

  const arcDrawer = useCallback((v: any) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(v);
    const material = new THREE.LineBasicMaterial({color: "green"});
    return new THREE.Line(geometry, material);
  }, []);

  const mouseEventStage = useRef<number>(0);

  const downHandler = () => {
    mouseEventStage.current = 1;
  };
  const upHandler = () => {
    if (mouseEventStage.current === 1) {
      mouseEventStage.current = 0;
      setSelected(-1);
      if (selectedSpritRef.current) {
        selectedSpritRef.current!.material.map = yellow_map;
      }
      selectedSpritRef.current = null;
      p.setSelected(-1);
    }
  };

  const moveHandler = () => {
    mouseEventStage.current = 0;
  };

  return (
    <div onMouseDown={downHandler} onMouseUp={upHandler} onMouseMove={moveHandler}>
      <Globe width={width}
        height={height}
        globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
        ref={myGlobe}
        objectAltitude="alt"
        objectLat="lat"
        objectLng="lng"
        objectsData={objectsData}
        objectThreeObject={satObject}
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
