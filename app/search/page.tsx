'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import TripCard from '@/components/TripCard';
import { Trip } from '@/types';
import { formatDateShort } from '@/lib/utils';

type TimeFilter = 'morning' | 'afternoon' | 'evening';
type PriceFilter = 'low' | 'medium' | 'high';
type DurationFilter = 'short' | 'medium' | 'long';
type SortOption = 'price-asc' | 'duration-asc' | 'departure-asc' | 'departure-desc';

function SearchResults() {
  const searchParams = useSearchParams();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const modesParam = searchParams.get('modes') || 'train,bus,minibus';

  // Филтри
  const [selectedTimes, setSelectedTimes] = useState<TimeFilter[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>(modesParam.split(','));
  const [selectedPrices, setSelectedPrices] = useState<PriceFilter[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<DurationFilter[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('departure-asc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function fetchTrips() {
      if (!from || !to) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&modes=${modesParam}`
        );

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        const formattedTrips: Trip[] = (data.trips || []).map((trip: any) => ({
          id: trip.id,
          from: trip.from_city,
          to: trip.to_city,
          type: trip.transport_type,
          departureTime: trip.departure_time,
          arrivalTime: trip.arrival_time,
          duration: trip.duration_minutes,
          price: parseFloat(trip.price),
          carrier: trip.carrier,
          departureLocation: trip.departure_location,
          arrivalLocation: trip.arrival_location,
          availableSeats: trip.available_seats,
          departureDate: trip.departure_date,
        }));

        setAllTrips(formattedTrips);
        setFilteredTrips(formattedTrips);
      } catch (error) {
        console.error('Error:', error);
        setAllTrips([]);
        setFilteredTrips([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [from, to, date, modesParam]);

  useEffect(() => {
    let result = [...allTrips];

    if (selectedTimes.length > 0) {
      result = result.filter((trip) => {
        const hour = parseInt(trip.departureTime.split(':')[0]);
        return selectedTimes.some((time) => {
          if (time === 'morning') return hour >= 6 && hour < 12;
          if (time === 'afternoon') return hour >= 12 && hour < 17;
          if (time === 'evening') return hour >= 17 && hour < 23;
          return false;
        });
      });
    }

    if (selectedModes.length > 0) {
      result = result.filter((trip) => selectedModes.includes(trip.type));
    }

    if (selectedPrices.length > 0) {
      result = result.filter((trip) => {
        return selectedPrices.some((price) => {
          if (price === 'low') return trip.price < 10;
          if (price === 'medium') return trip.price >= 10 && trip.price < 20;
          if (price === 'high') return trip.price >= 20;
          return false;
        });
      });
    }

    if (selectedDurations.length > 0) {
      result = result.filter((trip) => {
        return selectedDurations.some((dur) => {
          if (dur === 'short') return trip.duration < 120;
          if (dur === 'medium') return trip.duration >= 120 && trip.duration < 240;
          if (dur === 'long') return trip.duration >= 240;
          return false;
        });
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'duration-asc') return a.duration - b.duration;
      if (sortBy === 'departure-asc') return a.departureTime.localeCompare(b.departureTime);
      if (sortBy === 'departure-desc') return b.departureTime.localeCompare(a.departureTime);
      return 0;
    });

    setFilteredTrips(result);
  }, [allTrips, selectedTimes, selectedModes, selectedPrices, selectedDurations, sortBy]);

  const toggleFilter = <T,>(value: T, selected: T[], setter: (val: T[]) => void) => {
    if (selected.includes(value)) {
      setter(selected.filter((v) => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedTimes([]);
    setSelectedPrices([]);
    setSelectedDurations([]);
    setSelectedModes(modesParam.split(','));
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Час на тръгване</h3>
        <div className="space-y-2">
          {[
            { value: 'morning' as TimeFilter, label: '⏰ Сутрин (06:00-12:00)' },
            { value: 'afternoon' as TimeFilter, label: '🌤️ Обед (12:00-17:00)' },
            { value: 'evening' as TimeFilter, label: '🌙 Вечер (17:00-23:00)' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTimes.includes(value)}
                onChange={() => toggleFilter(value, selectedTimes, setSelectedTimes)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Вид транспорт</h3>
        <div className="space-y-2">
          {[
            { value: 'train', label: '🚆 Влак' },
            { value: 'bus', label: '🚌 Автобус' },
            { value: 'minibus', label: '🚐 Бус' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedModes.includes(value)}
                onChange={() => toggleFilter(value, selectedModes, setSelectedModes)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Цена</h3>
        <div className="space-y-2">
          {[
            { value: 'low' as PriceFilter, label: '💰 До €10' },
            { value: 'medium' as PriceFilter, label: '💵 €10-€20' },
            { value: 'high' as PriceFilter, label: '💶 €20+' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPrices.includes(value)}
                onChange={() => toggleFilter(value, selectedPrices, setSelectedPrices)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Продължителност</h3>
        <div className="space-y-2">
          {[
            { value: 'short' as DurationFilter, label: '⚡ До 2ч' },
            { value: 'medium' as DurationFilter, label: '⏱️ 2-4ч' },
            { value: 'long' as DurationFilter, label: '🐌 4ч+' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDurations.includes(value)}
                onChange={() => toggleFilter(value, selectedDurations, setSelectedDurations)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={clearAllFilters}
        className="text-sm text-primary-600 hover:text-primary-700 underline"
      >
        Изчисти всички филтри
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Ново търсене
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {from} → {to}
              </h1>
              {date && <p className="text-gray-600 mt-1">{formatDateShort(date)}</p>}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input-field py-2 text-sm"
              >
                <option value="departure-asc">📊 Най-ранни</option>
                <option value="departure-desc">🕙 Най-късни</option>
                <option value="price-asc">💰 Най-евтини</option>
                <option value="duration-asc">⚡ Най-бързи</option>
              </select>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden btn-primary flex items-center gap-2 py-2 px-4"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Филтри
              </button>
            </div>
          </div>
        </div>
        <div className="mb-4 text-sm text-gray-600">
          {loading ? (
            'Търсене...'
          ) : (
            <>
              Намерени <span className="font-semibold">{filteredTrips.length}</span> от{' '}
              <span className="font-semibold">{allTrips.length}</span> курса
            </>
          )}
        </div>
        <div className="flex gap-6">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="card sticky top-4">
              <h2 className="text-lg font-semibold mb-4 pb-4 border-b">Филтри</h2>
              <FiltersContent />
            </div>
          </aside>
          {showMobileFilters && (
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileFilters(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Филтри</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="text-gray-500 text-2xl">&times;</button>
                </div>
                <FiltersContent />
              </div>
            </div>
          )}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredTrips.length > 0 ? (
              <div className="space-y-4">
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Няма резултати</h3>
                <p className="text-gray-500 mb-6">
                  Няма курсове, които отговарят на избраните филтри.
                </p>
                <button onClick={clearAllFilters} className="btn-primary inline-block">
                  Изчисти филтрите
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Зареждане...</div>}>
      <SearchResults />
    </Suspense>
  );
}