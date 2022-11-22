import React, {useEffect, useRef, useState} from "react";
import Globe, {GlobeMethods} from "react-globe.gl";

const viewportSize = () => {
  const w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  const h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [w, h];
}

const Earth: React.ComponentType = () => {
  const myGlobe = useRef<GlobeMethods>();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

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

  return (
    <>
      <Globe width={width}
             height={height}
             globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
             backgroundImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
             ref={myGlobe} />
    </>
  )
};

export default Earth;
