'use client';
import { useState } from 'react';
import MapModal from './MapModal';
import { Trip } from '@/types';
import { formatDuration, formatPrice, getTransportIcon, getTransportLabel } from '@/lib/utils';
import { Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
  const [showMap, setShowMap] = useState(false);
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getTransportIcon(trip.type)}</span>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {getTransportLabel(trip.type)}
              </h3>
              <p className="text-sm text-gray-500">{trip.carrier}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {trip.departureTime}
              </div>
              <div className="text-sm text-gray-500">{trip.from}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(trip.departureDate || '').toLocaleDateString('bg-BG', {
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatDuration(trip.duration)}</span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded my-2"></div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {trip.arrivalTime}
              </div>
              <div className="text-sm text-gray-500">{trip.to}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(trip.departureDate || '').toLocaleDateString('bg-BG', {
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div>От: {trip.departureLocation}</div>
              <div>До: {trip.arrivalLocation}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Свободни места: {trip.availableSeats}</span>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6">
          <div className="text-center md:text-right">
            <div className="text-3xl font-bold text-primary-600">
              {formatPrice(trip.price)}
            </div>
            <div className="text-sm text-gray-500">на пътник</div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link href={`/booking/${trip.id}`} className="btn-primary text-center whitespace-nowrap block">
              Избери
            </Link>
            <>
              <button
                onClick={() => setShowMap(true)}
                className="text-primary-600 text-sm hover:underline text-center"
              >
                🗺️ Виж карта
              </button>

              <MapModal
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                from={trip.from}
                to={trip.to}
                departureLocation={trip.departureLocation}
                arrivalLocation={trip.arrivalLocation}
                transportType={trip.type}
              />
            </>
          </div>
        </div>

      </div>
    </div>
  );
}