import React, {useEffect, useMemo, useRef, useState} from "react";
import Globe, {GlobeMethods} from "react-globe.gl";
import {StateVector} from "../data/FlightDataManager";
import {FlightsByAircraft} from "../data/FlightData";
import * as THREE from "three";

const viewportSize = () => {
  const w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  const h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [w, h];
}

export type EarthProps = {
  flights: StateVector[];
};

const Earth: React.ComponentType<EarthProps> = (p) => {
  const myGlobe = useRef<GlobeMethods>();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [globeRadius, setGlobeRadius] = useState<number>(0);

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

  const objectsData = p.flights.map((state) => ({
    lat: state.latitude,
    lng: state.longitude,
    alt: .05
  })).filter((s) => s.lat && s.lng);

  const satObject = useMemo(() => {
    if (!globeRadius) return undefined;

    const satGeometry = new THREE.OctahedronGeometry(80 * globeRadius / 6371 / 2, 0);
    const satMaterial = new THREE.MeshLambertMaterial({ color: 'palegreen', transparent: true, opacity: 0.7 });
    return new THREE.Mesh(satGeometry, satMaterial);
  }, [globeRadius]);

  useEffect(() => {
    setGlobeRadius(myGlobe.current?.getGlobeRadius() || 0);
    myGlobe.current?.pointOfView({ altitude: 3.5 });
  }, []);


  // IDLE ANIMATION
  const [seconds, setSeconds] = useState(0);
  const [isIdle, setIsIdle] = useState(true);

  function reset() {
    setSeconds(0);
    setIsIdle(false);
  }

  useEffect(() => {
    const interval = setInterval(() => { 
      setSeconds(seconds => seconds + 1)
      if (isIdle) {
        document.onclick = reset
      } else if (!isIdle && seconds >= 5) {
        setIsIdle(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  const [flight, setFlight] = useState<FlightsByAircraft[]>([]);
  useEffect(() => {
    if(!isIdle) return;
    const item = p.flights[Math.floor(Math.random()*p.flights.length)];
    if (item) {
      let icao = item.icao24
      console.log(icao)
    } 
  }) 

  return (
    <>
      <Globe width={width}
             height={height}
             globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
             backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
             ref={myGlobe}
             objectAltitude="alt"
             objectLat="lat"
             objectLng="lng"
             objectsData={objectsData}
             objectThreeObject={satObject} />
    </>
  )
};

export default Earth;
