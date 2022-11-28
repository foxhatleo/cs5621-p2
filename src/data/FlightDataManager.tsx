import React, {useEffect} from "react";

const USERS: {username: string; password: string}[] = [
  {username: "wl353", password: "aby!jrw@xjm3hut2RCY"},
];

export async function makeReq<T = any>(uri: string, params: {[name: string]: any} = {}, user: number = 0): Promise<T | null> {
  if (uri.startsWith("/")) uri = uri.substring(1);
  const headers = user === 0 ? undefined : new Headers({
    "Authorization": "Basic " + btoa(`${USERS[user - 1].username}:${USERS[user - 1].password}`),
  });
  const paramsQuery = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const res = await fetch(`https://opensky-network.org/api/${uri}?${paramsQuery}`, {headers});
  if (res.status >= 400) {
    if (user < USERS.length) {
      return await makeReq<T>(uri, params, user + 1);
    } else {
      return null;
    }
  } else {
    return await res.json();
  }
}

export type StateVector = {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | string;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[];
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  category: number;
}

async function getAllFlights(): Promise<StateVector[] | null> {
  const allStates = await makeReq("/states/all", {});
  if (!allStates) return null;
  return (allStates.states as any[]).map<StateVector>((item: any) => ({
    icao24: item[0],
    callsign: item[1],
    origin_country: item[2],
    time_position: item[3],
    last_contact: item[4],
    longitude: item[5],
    latitude: item[6],
    baro_altitude: item[7],
    on_ground: item[8],
    velocity: item[9],
    true_track: item[10],
    vertical_rate: item[11],
    sensors: item[12],
    geo_altitude: item[13],
    squawk: item[14],
    spi: item[15],
    position_source: item[16],
    category: item[17],
  })).filter(s => !s.on_ground);
}

export type FlightDataManagerProps = {
  setAllFlights: (flights: StateVector[]) => void;
};

const FlightDataManager: React.ComponentType<FlightDataManagerProps> = (p) => {
  useEffect(() => {
    const allFlights = getAllFlights();
    allFlights.then((res) => {
      if (res == null) {
        alert("Cannot get flight data. Rate limit may have been reached.");
        return;
      }
      console.log("All states has been acquired.");
      console.dir(res);
      p.setAllFlights(res);
    });
  }, []);

  return (<></>);
};

export default FlightDataManager;
