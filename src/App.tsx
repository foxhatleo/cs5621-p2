import React, {useEffect, useState} from "react";
import Earth from "./components/Earth";
import getAllFlights, {StateVector, updateAllFlights} from "./data/AllFlights";
import UI from "./components/UI";
import getFlightsByAircraft, {FlightsByAircraft} from "./data/FlightData";
import "./App.css";

/**
 * App is the entry point of the application.
 */
function App() {
  const [flights, setFlights] = useState<StateVector[]>([]);
  const [selectedStateVector, setSelectedStateVector] = useState<StateVector | null>(null);
  const [flightData, setFlightData] = useState<FlightsByAircraft | null | false>(null);
  const [requestLiveUpdate, setRequestLiveUpdate] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      setFlights(await getAllFlights() || []);
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
        console.log("Live update request received.");
        const res = await updateAllFlights(flights);
        setFlights(res);
        setRequestLiveUpdate(false);
        console.log("Live update request fulfilled.");
      }
    })();
  }, [flights, requestLiveUpdate]);

  const setSelected = async (v: number) => {
    setSelectedStateVector(flights[v]);
    if (v === -1) {
      return;
    }
    setFlightData(null);
    const res = await getFlightsByAircraft(flights[v].icao24);
    if (!res) {
      setFlightData(false);
    } else {
      setFlightData(res.sort((a, b) => b.lastSeen - a.lastSeen)[0]);
    }
  };

  return (
    <div className="App">
      <Earth selectedFlightData={flightData === false ? null : flightData} flights={flights} setSelected={setSelected}/>
      <UI data={selectedStateVector} flight={flightData}/>
    </div>
  );
}

export default App;
