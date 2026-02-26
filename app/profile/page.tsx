'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateShort, getTransportIcon } from '@/lib/utils';
import { Calendar, MapPin, Ticket, User, Mail, CreditCard } from 'lucide-react';

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

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            trip:trips(*)
          `)
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

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Сигурни ли сте, че искате да анулирате тази резервация?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));

      alert('Резервацията е анулирана успешно!');
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Грешка при анулиране на резервацията');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Pending',
      confirmed: 'Потвърдена',
      cancelled: 'Анулирана',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Зареждане...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* User Info Card */}
        <div className="card mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Моят Профил</h1>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">ID: {user.id.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Член от: {new Date(user.created_at).toLocaleDateString('bg-BG')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              Изход
            </button>
          </div>
        </div>

        {/* Bookings Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              Моите Резервации ({bookings.length})
            </h2>
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
          ) : bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Left: Trip Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-3xl">
                          {getTransportIcon(booking.trip.transport_type as 'train' | 'bus' | 'minibus')}
                        </span>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {booking.trip.from_city} → {booking.trip.to_city}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {booking.trip.carrier}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(booking.trip.departure_date).toLocaleDateString('bg-BG')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {booking.trip.departure_time} - {booking.trip.arrival_time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Ticket className="w-4 h-4" />
                          <span>{booking.num_seats} билет(а)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-semibold">
                            {formatPrice(booking.total_price)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          Код за резервация:{' '}
                          <span className="font-mono font-semibold text-primary-600">
                            {booking.booking_reference}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Създадена на:{' '}
                          {new Date(booking.created_at).toLocaleString('bg-BG')}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      {getStatusBadge(booking.status)}
                      
                      {booking.status === 'pending' && (
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
              ))}
            </div>
          ) : (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Няма резервации
              </h3>
              <p className="text-gray-500 mb-6">
                Все още нямате направени резервации.
              </p>
              <a href="/" className="btn-primary inline-block">
                Търси курсове
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}