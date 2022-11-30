import makeReq from "./Request";
import {StateVector} from "./AllFlights";

type AdditionalInfo = {
  firstSeen: number;
  estDepartureAirport: string;
  lastSeen: number;
  estArrivalAirport: string;
}

/** A extension of StateVector that includes more information such as departure and arrival airport. */
export type DetailedStateVector = AdditionalInfo & StateVector;

/**
 * Generate a DetailedStateVector based on a StateVector but use the same placeholder string for all fields.
 *
 * @param sv The StateVector.
 * @param placeholder The placeholder. Every field in the returned DSV that is not part of StateVector will be this
 * value.
 */
export function getPlaceholderDetailedStateVector(sv: StateVector, placeholder: string): DetailedStateVector {
  return {
    ...sv,
    firstSeen: 0,
    estDepartureAirport: placeholder,
    lastSeen: 0,
    estArrivalAirport: placeholder,
  };
}

const cache: { [icao24: string]: AdditionalInfo } = {};

/**
 * Given a StateVector, grab additional information from cache if exists.
 *
 * @param sv The StateVector.
 */
export function getCachedDetailedStateVector(sv: StateVector): DetailedStateVector | null {
  return cache[sv.icao24] ? {...cache[sv.icao24], ...sv} : null;
}

/**
 * Given a StateVector, grab additional information such as the departing and landing airport.
 *
 * @param sv The StateVector.
 */
async function getDetailedStateVector(sv: StateVector): Promise<DetailedStateVector> {
  const flights = await makeReq("/flights/aircraft", {
    "icao24": sv.icao24,
    "begin": Math.round(Date.now() / 1000) - 86400,
    "end": Math.round(Date.now() / 1000)
  });
  if (!flights) return getPlaceholderDetailedStateVector(sv, "Unknown");
  return (flights as any[]).map<DetailedStateVector>((item: any) => {
    const additional: AdditionalInfo = {
      firstSeen: item["firstSeen"],
      estDepartureAirport: item["estDepartureAirport"],
      lastSeen: item["lastSeen"],
      estArrivalAirport: item["estArrivalAirport"],
    };
    cache[sv.icao24] = additional;
    return {
      ...additional,
      ...sv,
    };
  }).sort((a, b) => b.lastSeen - a.lastSeen)[0];
}

export default getDetailedStateVector;
