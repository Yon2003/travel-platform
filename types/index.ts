export type TransportType = 'train' | 'bus' | 'minibus';

export interface City {
  id: number;
  name: string;
}

export interface Trip {
  id: number;
  from: string;
  to: string;
  type: TransportType;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  carrier: string;
  departureLocation: string;
  arrivalLocation: string;
  availableSeats: number;
  departureDate?: string;
}