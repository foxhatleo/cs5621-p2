import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import Earth from "./components/Earth";
import AllFlights, {StateVector} from "./data/AllFlights";
import UI from "./components/UI";
import getFlightsByAircraft, {FlightsByAircraft} from "./data/FlightData";
import AirportsData from "./data/AirportsData";

function App() {
  const [flights, setFlights] = useState<StateVector[]>([]);
  const [selectedStateVector, setSelectedStateVector] = useState<StateVector | null>(null);
  const [flightData, setFlightData] = useState<FlightsByAircraft | null | false>(null);

  const dataUpdater = (res: StateVector[]) => {
    setFlights(res);
  };

  const setSelected = async (v: number) => {
    setSelectedStateVector(flights[v]);
    const res = await getFlightsByAircraft(flights[v].icao24);
    if (!res) {
      setFlightData(false);
    } else {
      setFlightData(res.sort((a, b) => b.lastSeen - a.lastSeen)[0]);
    }
  };

  return (
    <div className="App">
      <Earth flights={flights} setSelected={setSelected} />
      <AllFlights setAllFlights={dataUpdater} />
      <UI data={selectedStateVector} flight={flightData} />
    </div>
  );
}

export default App;
