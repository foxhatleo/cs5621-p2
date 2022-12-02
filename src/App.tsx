import React, {useEffect, useRef, useState} from "react";
import Earth from "./components/Earth";
import getAllStateVectors, {StateVector, updateAllStateVectors} from "./data/AllFlights";
import UI from "./components/UI";
import getDetailedStateVector, {
  DetailedStateVector, getCachedDetailedStateVector,
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
  /** This is the selected ICAO. "" for nothing selected. */
  const [selectedIcao, setSelectedIcao] = useState<string>("");
  /** This is the up to date selected ICAO. */
  const updateToDateSelectedIcao = useRef<string>("");
  /** A flag as signal if a live update is needed right now. */
  const [requestLiveUpdate, setRequestLiveUpdate] = useState<boolean>(false);

  // This hook loads state vectors and start the interval for live updates.
  useEffect(() => {
    (async () => {
      setStateVectors(await getAllStateVectors(.3) || []);
    })();
    const liveUpdateInterval = setInterval(() => {
      setRequestLiveUpdate(true);
    }, 5000);
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
      if (selectedIcao != "") {
        const stateVector = stateVectors.find(s => s.icao24 === selectedIcao);
        if (stateVector === undefined) {
          setSelectedIcao("");
          setDetailedStateVector(null);
          return;
        }
        // If there is a detailed state vector and its ICAO24 is the same as the state vector's ICAO24,
        // use that DSV and patch it with updated info in the SV.
        if (detailedStateVector && detailedStateVector.icao24 === stateVector.icao24) {
          setDetailedStateVector({...detailedStateVector, ...stateVector});

        // Load the DSV.
        } else {
          // Loading could take some time, so use a placeholder DSV first.
          setDetailedStateVector(getPlaceholderDetailedStateVector(stateVector, "Loading"));
          const icao = selectedIcao;
          const newDSV = getCachedDetailedStateVector(stateVector) || (await getDetailedStateVector(stateVector));
          if (updateToDateSelectedIcao.current === icao) {
            setDetailedStateVector(newDSV);
          }
        }
      }
    })();
  }, [stateVectors, selectedIcao]);

  const updateSelected = (v: number): void => {
    setSelectedIcao(stateVectors[v].icao24);
    updateToDateSelectedIcao.current = stateVectors[v].icao24;
  };

  return (
    <div className="App">
      <Earth selected={detailedStateVector} selecting={selectedIcao != ""} stateVectors={stateVectors}
        setSelected={updateSelected} />
      <UI data={detailedStateVector} showing={selectedIcao != ""} />
    </div>
  );
}

export default App;
