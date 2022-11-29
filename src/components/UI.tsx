import React, {useEffect, useState} from "react";
import {StateVector} from "../data/AllFlights";

export type UIProps = {
  data: StateVector | null;
};

const UI: React.ComponentType<UIProps> = (p) => {
  const [data, setData] = useState<StateVector | null>(null);
  const show = !!p.data;
  useEffect(() => {
    if (p.data) {
      setData(p.data);
    }
  }, [p.data]);
  const labels: { [label: string]: keyof StateVector } = {
    "ICAO24": "icao24",
    "Callsign": "callsign",
    "Origin Country/Region": "origin_country",
    "Longitude": "longitude",
    "Latitude": "latitude",
    "Velocity": "velocity",
    "Heading": "true_track",
  };
  return (
    <div className={"ui" + (show ? " show" : "")}>
      <table>
        {data ? Object.entries(labels).map(([label, key], ind) => (
          <tr key={ind}>
            <td className={"ui-td1"}>{label}</td>
            <td>{"  "}</td>
            <td className={"ui-td2"}>{data[key] || "Unknown"}</td>
          </tr>
        )) : null}
      </table>
      <style>{`
        .ui {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 10;
          padding: 10px;
          background: rgb(57, 65, 77);
          border: 3px solid rgb(33, 35, 38);
          color: white;
          font-family: Helvetica, Arial, "Segoe UI", sans-serif;
          transition: .5s ease-in-out opacity;
          opacity: 0;
          pointer-events: none;
        }
        .ui.show {
          opacity: 1;
        }
        .ui-td1 {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default UI;
