import makeReq from "./Request";

/**
 * This is the state of a flight.
 */
export type StateVector = {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | string;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  artificial_altitude: number;
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

/**
 * Convert a state object from OpenSky to a StateVector object.
 *
 * @param item A state object.
 */
function stateToStateVector(item: any): StateVector {
  return {
    icao24: item[0],
    callsign: item[1],
    origin_country: item[2],
    time_position: item[3],
    last_contact: item[4],
    longitude: item[5],
    latitude: item[6],
    baro_altitude: item[7],
    artificial_altitude: .05 + Math.random() * .025,
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
  };
}

/**
 * Get the list of all flights. If process fails, an empty array is returned.
 *
 * @param threshold The amount of flights to keep. For example, .2 means 20% of the flights will be random selected and
 * returned. Must be within [0,1].
 */
async function getAllFlights(threshold = .2): Promise<StateVector[]> {
  const allStates = await makeReq("/states/all", {});

  if (!allStates) {
    alert("Cannot get flight data. Rate limit may have been reached.");
    return [];
  }

  const res = (allStates.states as any[])
    .map<StateVector>(stateToStateVector)
    .filter(s => !s.on_ground && s.longitude && s.latitude);

  const thresholdRes = [];
  for (let i = 0, j = res.length * threshold; i < j; i++) {
    thresholdRes.push(res.splice(Math.floor(res.length * Math.random()), 1)[0]);
  }

  console.log(`All states has been acquired, with threshold ${threshold}.`);
  console.log(`${res.length} flights from OpenSky, ${thresholdRes.length} flights after threshold selection.`);
  console.dir(thresholdRes);
  return thresholdRes;
}

/**
 * Given a list of StateVectors, return an updated list of StateVectors with new position and heading data.
 *
 * @param orig Original list of state vectors.
 */
export async function updateAllFlights(orig: StateVector[]): Promise<StateVector[]> {
  if (orig.length === 0) return orig;

  const allStates = await makeReq("/states/all", {});

  if (allStates == null) {
    return orig;
  }

  const lookup: {[icao24: string]: StateVector} = {};
  for (const state of (allStates.states as any[])) {
    const sv = stateToStateVector(state);
    lookup[sv.icao24] = sv;
  }

  const newLst: StateVector[] = [];
  for (const origSV of orig) {
    const newSV = lookup[origSV.icao24];
    if (newSV) newSV.artificial_altitude = origSV.artificial_altitude;
    newLst.push(newSV || origSV);
    if (newSV &&
      (
        newSV.latitude != origSV.latitude ||
        newSV.longitude != origSV.longitude ||
        newSV.true_track != origSV.true_track
      )) {
      console.log(`Flight ${origSV.icao24} has changed position or heading during live update.`);
    }
  }

  return newLst;
}

export default getAllFlights;
