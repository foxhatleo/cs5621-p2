import React, {useEffect} from "react";
import {makeReq} from "./AllFlights";

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
  const flights = await makeReq("/flights/aircraft", {'icao24': ICAO, 'begin': Math.round(Date.now()/1000) - rewind, 'end': Math.round(Date.now()/1000)});
  if (!flights) return null;
  return (flights as any[]).map<FlightsByAircraft>((item: any) => ({
    icao24: item['icao24'],
    firstSeen: item['firstSeen'],
    estDepartureAirport: item['estDepartureAirport'],
    lastSeen: item['lastSeen'],
    estArrivalAirport: item['estArrivalAirport'],
    callsign: item['callsign'],
    estDepartureAirportHorizDistance: item['estDepartureAirportHorizDistance'],
    estDepartureAirportVertDistance: item['estDepartureAirportVertDistance'],
    estArrivalAirportHorizDistance: item['estArrivalAirportHorizDistance'],
    estArrivalAirportVertDistance: item['estArrivalAirportVertDistance'],
    departureAirportCandidatesCount: item['departureAirportCandidatesCount'],
    arrivalAirportCandidatesCount: item['11']
  }));
}


export default getFlightsByAircraft;
