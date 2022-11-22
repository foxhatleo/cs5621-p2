import React, {useCallback, useEffect, useState} from 'react';
import './App.css';
import Earth from "./components/Earth";
import FlightDataManager from "./data/FlightDataManager";

function App() {
  return (
    <div className="App">
      <Earth />
      <FlightDataManager />
    </div>
  );
}

export default App;
