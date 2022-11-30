import makeReq from "./Request";

export type FlightsByAircraft = {
  icao24: string;
  callsign: string | null;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  estDepartureAirportHorizDistance: number;
  estDepartureAirportVertDistance: number;
  estArrivalAirportHorizDistance: number;
  estArrivalAirportVertDistance: number;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

async function getFlightsByAircraft(ICAO: string, rewind = 86400): Promise<FlightsByAircraft[] | null> {
  const flights = await makeReq("/flights/aircraft", {
    "icao24": ICAO,
    "begin": Math.round(Date.now() / 1000) - rewind,
    "end": Math.round(Date.now() / 1000)
  });
  if (!flights) return null;
  return (flights as any[]).map<FlightsByAircraft>((item: any) => ({
    icao24: item["icao24"],
    firstSeen: item["firstSeen"],
    estDepartureAirport: item["estDepartureAirport"],
    lastSeen: item["lastSeen"],
    estArrivalAirport: item["estArrivalAirport"],
    callsign: item["callsign"],
    estDepartureAirportHorizDistance: item["estDepartureAirportHorizDistance"],
    estDepartureAirportVertDistance: item["estDepartureAirportVertDistance"],
    estArrivalAirportHorizDistance: item["estArrivalAirportHorizDistance"],
    estArrivalAirportVertDistance: item["estArrivalAirportVertDistance"],
    departureAirportCandidatesCount: item["departureAirportCandidatesCount"],
    arrivalAirportCandidatesCount: item["arrivalAirportCandidatesCount"]
  }));
}


export default getFlightsByAircraft;
