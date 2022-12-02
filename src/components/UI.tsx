import React from "react";
import AirportsData from "../data/AirportsData";
import {DetailedStateVector} from "../data/DetailedFlightData";
import "./UI.css";

/**
 * Get the friendly name of an airport by its ICAO identifier, if exists.
 *
 * @param k ICAO code or nll.
 */
const getFriendlyNameOfAirport = (k: string | null): string | null => {
  if (!k) return null;
  const res = AirportsData[k];
  if (res) {
    const n = res.name;
    if (!n) return k;
    if (n.endsWith(" International Airport")) return n.substring(0, n.length - 22);
    if (n.endsWith(" Airport")) return n.substring(0, n.length - 8);
  }
  return k;
};

export type UIProps = {
  data: DetailedStateVector | null;
  showing: boolean;
};

/**
 * The UI Box at the bottom right corner.
 */
const UI: React.ComponentType<UIProps> = (p) => {
  const labels: { [label: string]: keyof DetailedStateVector } = {
    "ICAO24": "icao24",
    "Callsign": "callsign",
    "Origin Country/Region": "origin_country",
    "Longitude": "longitude",
    "Latitude": "latitude",
    "Altitude(m)": "baro_altitude",
    "Velocity": "velocity",
    "Heading": "true_track",
    "Departure Airport": "estDepartureAirport",
  };

  return (
    <div className={"ui" + (p.showing ? " show" : "")}>
      <table>
        <tbody>
          {p.data ? Object.entries(labels).map(([label, key], ind) => (
            <tr key={ind}>
              <td className={"ui-td1"}>{label}</td>
              <td>{"  "}</td>
              <td className={"ui-td2"}>
                {(label.includes("Airport") ?
                  getFriendlyNameOfAirport(p.data![key] as string | null) :
                  p.data![key]) || "Unknown"}
              </td>
            </tr>
          )) : null}
        </tbody>
      </table>
    </div>
  );
};

export default UI;
