'use client';

import { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

interface RouteMapProps {
  from: string;
  to: string;
  departureLocation?: string;
  arrivalLocation?: string;
  transportType?: 'train' | 'bus' | 'minibus';
}

export default function RouteMap({ 
  from, 
  to, 
  departureLocation, 
  arrivalLocation,
  transportType = 'bus'
}: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Google Maps API key не е конфигуриран</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-200">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 42.6977, lng: 23.3219 }}
          defaultZoom={7}
          mapId="travel-route-map"
        >
          <DirectionsRenderer 
            origin={from} 
            destination={to}
            transportType={transportType}
          />
        </Map>
      </APIProvider>
    </div>
  );
}

function DirectionsRenderer({ 
  origin, 
  destination,
  transportType = 'bus'
}: { 
  origin: string; 
  destination: string;
  transportType?: 'train' | 'bus' | 'minibus';
}) {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;

    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: transportType === 'train' ? '#059669' : '#0284c7',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [map, transportType]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !map) return;

    const travelMode = transportType === 'train' 
      ? google.maps.TravelMode.TRANSIT 
      : google.maps.TravelMode.DRIVING;

    directionsService.route(
      {
        origin: `${origin}, България`,
        destination: `${destination}, България`,
        travelMode: travelMode,
        ...(transportType === 'train' && {
          transitOptions: {
            modes: [google.maps.TransitMode.RAIL]
          }
        })
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination, map, transportType]);

  return null;
}