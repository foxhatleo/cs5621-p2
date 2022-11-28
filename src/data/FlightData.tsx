import React, {useEffect} from "react";
import {makeReq} from "./FlightDataManager";

export type FlightsByAircraft = {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  callsign: string | null;
  estDepartureAirportHorizDistance: number;
  estDepartureAirportVertDistance: number;
  estArrivalAirportHorizDistance: number;
  estArrivalAirportVertDistance: number;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

async function getFlightsByAircraft(ICAO: string, rewind: number = 86400): Promise<FlightsByAircraft[] | null> {
  const flights = await makeReq("/flights/aircraft", {'icao24': ICAO, 'begin': Date.now() - rewind, 'end': Date.now()});
  if (!flights) return null;
  return (flights.states as any[]).map<FlightsByAircraft>((item: any) => ({
    icao24: item[0],
    firstSeen: item[1],
    estDepartureAirport: item[2],
    lastSeen: item[3],
    estArrivalAirport: item[4],
    callsign: item[5],
    estDepartureAirportHorizDistance: item[6],
    estDepartureAirportVertDistance: item[7],
    estArrivalAirportHorizDistance: item[8],
    estArrivalAirportVertDistance: item[9],
    departureAirportCandidatesCount: item[10],
    arrivalAirportCandidatesCount: item[11]
  }));
}


export default getFlightsByAircraft; 