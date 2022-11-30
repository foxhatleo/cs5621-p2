import React, {useEffect, useState} from "react";
import Earth from "./components/Earth";
import getAllStateVectors, {StateVector, updateAllStateVectors} from "./data/AllFlights";
import UI from "./components/UI";
import getDetailedStateVector, {
  DetailedStateVector,
  getPlaceholderDetailedStateVector
} from "./data/DetailedFlightData";
import "./App.css";

/**
 * App is the entry point of the application.
 */
function App() {
  /** This is the list of state vectors. */
  const [stateVectors, setStateVectors] = useState<StateVector[]>([]);
  /** This is the detailed state vector for the selected index. */
  const [detailedStateVector, setDetailedStateVector] = useState<DetailedStateVector | null>(null);
  /** This is the selected index. -1 for nothing selected. */
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  /** A flag as signal if a live update is needed right now. */
  const [requestLiveUpdate, setRequestLiveUpdate] = useState<boolean>(false);

  // This hook loads state vectors and start the interval for live updates.
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

  // This hook does the live update when requestLiveUpdate is true.
  useEffect(() => {
    (async () => {
      if (requestLiveUpdate) {
        const res = await updateAllStateVectors(stateVectors);
        setStateVectors(res);
        setRequestLiveUpdate(false);
      }
    })();
  }, [stateVectors, requestLiveUpdate]);

  // This hook loads the detailed state vector when a flight is selected.
  useEffect(() => {
    (async () => {
      if (selectedIndex >= 0) {
        const stateVector = stateVectors[selectedIndex];
        // If there is a detailed state vector and its ICAO24 is the same as the state vector's ICAO24,
        // use that DSV and patch it with updated info in the SV.
        if (detailedStateVector && detailedStateVector.icao24 === stateVector.icao24) {
          setDetailedStateVector({...detailedStateVector, ...stateVector});

        // Load the DSV.
        } else {
          // Loading could take some time, so use a placeholder DSV first.
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
        setSelected={setSelectedIndex} />
      <UI data={detailedStateVector} showing={selectedIndex >= 0} />
    </div>
  );
}

export default App;
