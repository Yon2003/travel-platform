'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatPrice, getTransportIcon } from '@/lib/utils';
import { Calendar, MapPin, Ticket, CreditCard } from 'lucide-react';

interface Booking {
  id: string;
  trip_id: number;
  seats: number[];
  num_seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  booking_reference: string;
  created_at: string;
  trip: {
    from_city: string;
    to_city: string;
    transport_type: string;
    departure_time: string;
    arrival_time: string;
    departure_date: string;
    carrier: string;
  };
}

function isPast(departureDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departure = new Date(departureDateStr);
  departure.setHours(0, 0, 0, 0);
  return departure < today;
}

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`*, trip:trips(*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    }

    if (user) fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Сигурни ли сте, че искате да анулирате тази резервация?')) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));
      alert('Резервацията е анулирана успешно!');
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Грешка при анулиране на резервацията');
    }
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'cancelled') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Анулирана</span>;
    }
    if (isPast(booking.trip.departure_date)) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">Изтекъл</span>;
    }
    if (booking.status === 'confirmed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Потвърдена</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>;
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Зареждане...</div>;
  }

  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && !isPast(b.trip.departure_date));
  const historyBookings = bookings.filter(b => b.status === 'cancelled' || isPast(b.trip.departure_date));

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const expired = isPast(booking.trip.departure_date);
    return (
      <div className={`card hover:shadow-lg transition-shadow ${expired || booking.status === 'cancelled' ? 'opacity-70' : ''}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl">
                {getTransportIcon(booking.trip.transport_type as 'train' | 'bus' | 'minibus')}
              </span>
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.trip.from_city} → {booking.trip.to_city}
                </h3>
                <p className="text-sm text-gray-500">{booking.trip.carrier}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.trip.departure_date).toLocaleDateString('bg-BG')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{booking.trip.departure_time} - {booking.trip.arrival_time}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Ticket className="w-4 h-4" />
                <span>{booking.num_seats} билет(а)</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span className="font-semibold">{formatPrice(booking.total_price)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500">
                Код:{' '}
                <span className="font-mono font-semibold text-primary-600">
                  {booking.booking_reference}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Създадена на: {new Date(booking.created_at).toLocaleString('bg-BG')}
              </p>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 lg:gap-0 lg:space-y-3 pt-3 lg:pt-0 border-t lg:border-t-0">
            {getStatusBadge(booking)}
            <div className="flex flex-col space-y-2">
              {booking.status === 'confirmed' && !expired && (
                <Link
                  href={`/ticket/${booking.id}`}
                  className="btn-primary text-sm px-4 py-2 inline-flex items-center justify-center space-x-2"
                >
                  <span>🎫</span>
                  <span>Виж билет</span>
                </Link>
              )}
              {booking.status === 'confirmed' && expired && (
                <Link
                  href={`/ticket/${booking.id}`}
                  className="text-sm px-4 py-2 inline-flex items-center justify-center space-x-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <span>🎫</span>
                  <span>Виж билет</span>
                </Link>
              )}
              {booking.status === 'pending' && !expired && (
                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline"
                >
                  Анулирай
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Моите Резервации</h1>
          <Link href="/profile" className="text-primary-600 hover:underline text-sm">
            ← Профил
          </Link>
        </div>

        {loadingBookings ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Активни резервации */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <span>🎫</span>
                <span>Активни резервации ({activeBookings.length})</span>
              </h2>

              {activeBookings.length > 0 ? (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              ) : (
                <div className="card text-center py-10">
                  <p className="text-gray-500 mb-4">Нямате активни резервации.</p>
                  <a href="/" className="btn-primary inline-block">Търси курсове</a>
                </div>
              )}
            </div>

            {/* История */}
            {historyBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-gray-500">
                  <span>🕐</span>
                  <span>История ({historyBookings.length})</span>
                </h2>
                <div className="space-y-4">
                  {historyBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
