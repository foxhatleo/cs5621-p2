import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import Earth from "./components/Earth";
import FlightDataManager, {StateVector} from "./data/FlightDataManager";

function App() {
  const [flights, setFlights] = useState<StateVector[]>([]);

  const dataUpdater = (res: StateVector[]) => {
    setFlights(res);
  };

  return (
    <div className="App">
      <Earth flights={flights} />
      <FlightDataManager setAllFlights={dataUpdater} />
    </div>
  );
}

export default App;
