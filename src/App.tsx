import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import Earth from "./components/Earth";
import AllFlights, {StateVector} from "./data/AllFlights";
import UI from "./components/UI";

function App() {
  const [flights, setFlights] = useState<StateVector[]>([]);
  const [selectedStateVector, setSelectedStateVector] = useState<StateVector | null>(null);

  const dataUpdater = (res: StateVector[]) => {
    setFlights(res);
  };

  const setSelected = (v: number) => {
    setSelectedStateVector(flights[v]);
  };

  return (
    <div className="App">
      <Earth flights={flights} setSelected={setSelected} />
      <AllFlights setAllFlights={dataUpdater} />
      <UI data={selectedStateVector} />
    </div>
  );
}

export default App;
