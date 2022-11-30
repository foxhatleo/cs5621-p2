import React, {useEffect, useState} from "react";
import Earth from "./components/Earth";
import getAllStateVectors, {StateVector, updateAllStateVectors} from "./data/AllFlights";
import UI from "./components/UI";
import "./App.css";
import getDetailedStateVector, {
  DetailedStateVector,
  getPlaceholderDetailedStateVector
} from "./data/DetailedFlightData";

/**
 * App is the entry point of the application.
 */
function App() {
  const [stateVectors, setStateVectors] = useState<StateVector[]>([]);
  const [detailedStateVector, setDetailedStateVector] = useState<DetailedStateVector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [requestLiveUpdate, setRequestLiveUpdate] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      setStateVectors(await getAllStateVectors() || []);
    })();
    const liveUpdateInterval = setInterval(() => {
      setRequestLiveUpdate(true);
    }, 2000);
    return () => {
      clearInterval(liveUpdateInterval);
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (requestLiveUpdate) {
        const res = await updateAllStateVectors(stateVectors);
        setStateVectors(res);
        setRequestLiveUpdate(false);
      }
    })();
  }, [stateVectors, requestLiveUpdate]);

  const setSelected = async (v: number) => {
    setSelectedIndex(v);
  };

  useEffect(() => {
    (async () => {
      if (selectedIndex >= 0) {
        const stateVector = stateVectors[selectedIndex];
        if (detailedStateVector && detailedStateVector.icao24 === stateVector.icao24) {
          setDetailedStateVector({...detailedStateVector, ...stateVector});
        } else {
          setDetailedStateVector(getPlaceholderDetailedStateVector(stateVector, "Loading"));
          const newDSV = await getDetailedStateVector(stateVector);
          setDetailedStateVector(newDSV);
        }
      }
    })();
  }, [stateVectors, selectedIndex]);

  return (
    <div className="App">
      <Earth selected={detailedStateVector} selecting={selectedIndex >= 0} stateVectors={stateVectors}
        setSelected={setSelected} />
      <UI data={detailedStateVector} showing={selectedIndex >= 0} />
    </div>
  );
}

export default App;
