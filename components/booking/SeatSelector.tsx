'use client';

import { useEffect, useState } from 'react';
import { User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SeatSelectorProps {
  tripId: number;
  totalSeats: number;
  transportType: 'train' | 'bus' | 'minibus';
  onSeatsSelected: (seats: number[]) => void;
  maxSeats?: number;
}

type SeatStatus = 'available' | 'selected' | 'reserved' | 'taken';

interface Seat {
  number: number;
  status: SeatStatus;
  row: number;
  position: 'A' | 'B' | 'C' | 'D';
}

export default function SeatSelector({
  tripId,
  totalSeats,
  transportType,
  onSeatsSelected,
  maxSeats = 5,
}: SeatSelectorProps) {
  const { user } = useAuth(); // ДОБАВИ ТОВА
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Генерирай места
  // Зареди заети места от сървъра
// Резервирай избраните места
useEffect(() => {
  async function fetchSeats() {
    setLoading(true);
    try {
      const response = await fetch(`/api/seats/${tripId}`);
      if (!response.ok) throw new Error('Failed to fetch seats');
      
      const { takenSeats } = await response.json();
      const layout = getLayoutForTransport(transportType, totalSeats, takenSeats);
      setSeats(layout);
    } catch (error) {
      console.error('Error fetching seats:', error);
      const layout = getLayoutForTransport(transportType, totalSeats, []);
      setSeats(layout);
    } finally {
      setLoading(false);
    }
  }

  if (tripId) {
    fetchSeats();
    
    // ДОБАВИ ТОВА: Refresh на всеки 10 секунди
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }
}, [tripId, totalSeats, transportType]);




  const handleSeatClick = (seatNumber: number) => {
    const seat = seats.find((s) => s.number === seatNumber);
    if (!seat || seat.status === 'reserved' || seat.status === 'taken') return;

    if (selectedSeats.includes(seatNumber)) {
      // Deselect
      const newSelected = selectedSeats.filter((n) => n !== seatNumber);
      setSelectedSeats(newSelected);
      onSeatsSelected(newSelected);  // ← ТОВА ИЗВИКВА родителя
    } else {
      // Select
      if (selectedSeats.length >= maxSeats) {
        alert(`Можете да изберете максимум ${maxSeats} места`);
        return;
      }
      const newSelected = [...selectedSeats, seatNumber];
      setSelectedSeats(newSelected);
      onSeatsSelected(newSelected);  // ← И ТОВА
    }
  };

  const getSeatClass = (seat: Seat) => {
    const baseClass = 'w-12 h-12 rounded-lg flex items-center justify-center text-sm font-semibold cursor-pointer transition-all hover:scale-110';

    if (selectedSeats.includes(seat.number)) {
      return `${baseClass} bg-primary-600 text-white shadow-lg`;
    }

    switch (seat.status) {
      case 'available':
        return `${baseClass} bg-gray-100 border-2 border-gray-300 text-gray-700 hover:border-primary-500`;
      case 'reserved':
        return `${baseClass} bg-yellow-100 border-2 border-yellow-400 text-yellow-700 cursor-not-allowed`;
      case 'taken':
        return `${baseClass} bg-red-100 border-2 border-red-400 text-red-700 cursor-not-allowed`;
      default:
        return baseClass;
    }
  };

  // Групирай места по редове
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Изберете места</h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded"></div>
          <span>Свободно</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded"></div>
          <span>Избрано</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded"></div>
          <span>Заето</span>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">

        {/* Driver */}
        <div className="flex justify-end mb-6">
          <div className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm">Водач</span>
          </div>
        </div>

        {/* Seats Grid */}
        <div className="space-y-3">
          {Object.keys(rows)
            .sort((a, b) => Number(a) - Number(b))
            .map((rowNum) => {
              const rowSeats = rows[Number(rowNum)].sort((a, b) =>
                a.position.localeCompare(b.position)
              );

              return (
                <div key={rowNum} className="flex items-center justify-center space-x-3">
                  <span className="w-8 text-sm text-gray-500 text-center">{rowNum}</span>

                  {/* Left side (A, B) */}
                  {rowSeats
                    .filter((s) => s.position === 'A' || s.position === 'B')
                    .map((seat) => (
                      <button
                        type="button"
                        key={seat.number}
                        onClick={() => handleSeatClick(seat.number)}
                        className={getSeatClass(seat)}
                        disabled={seat.status === 'reserved' || seat.status === 'taken'}
                        title={`Място ${seat.number}`}
                      >
                        {seat.number}
                      </button>
                    ))}

                  {/* Aisle */}
                  <div className="w-8"></div>

                  {/* Right side (C, D) */}
                  {rowSeats
                    .filter((s) => s.position === 'C' || s.position === 'D')
                    .map((seat) => (
                      <button
                        type="button"
                        key={seat.number}
                        onClick={() => handleSeatClick(seat.number)}
                        className={getSeatClass(seat)}
                        disabled={seat.status === 'reserved' || seat.status === 'taken'}
                        title={`Място ${seat.number}`}
                      >
                        {seat.number}
                      </button>
                    ))}
                </div>
              );
            })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-900">
                Избрани места: {selectedSeats.sort((a, b) => a - b).join(', ')}
              </p>
              <p className="text-xs text-primary-700 mt-1">
                Общо: {selectedSeats.length} {selectedSeats.length === 1 ? 'място' : 'места'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedSeats([]);
                onSeatsSelected([]);
              }}
              className="text-primary-600 hover:text-primary-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function за генериране на места според типа превоз
function getLayoutForTransport(
  type: 'train' | 'bus' | 'minibus',
  total: number,
  takenSeats: number[] = []
): Seat[] {
  const seats: Seat[] = [];
  const positions: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  let seatsPerRow = 4;
  if (type === 'minibus') seatsPerRow = 4;
  if (type === 'bus') seatsPerRow = 4;
  if (type === 'train') seatsPerRow = 4;

  let seatNum = 1;
  let row = 1;

  while (seatNum <= total) {
    for (let i = 0; i < seatsPerRow && seatNum <= total; i++) {
      seats.push({
        number: seatNum,
        status: takenSeats.includes(seatNum) ? 'taken' : 'available',
        row,
        position: positions[i],
      });
      seatNum++;
    }
    row++;
  }

  return seats;
}