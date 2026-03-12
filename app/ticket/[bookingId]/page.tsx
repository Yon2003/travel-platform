'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ArrowLeft, Train, Bus, Navigation } from 'lucide-react';
import { formatPrice, getTransportIcon, getTransportLabel } from '@/lib/utils';
import Link from 'next/link';

interface TicketPageProps {
  params: {
    bookingId: string;
  };
}

interface Booking {
  id: string;
  booking_reference: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  seats: number[];
  num_seats: number;
  total_price: number;
  status: string;
  created_at: string;
  trip: {
    from_city: string;
    to_city: string;
    transport_type: 'train' | 'bus' | 'minibus';
    departure_time: string;
    arrival_time: string;
    departure_date: string;
    carrier: string;
    departure_location: string;
    arrival_location: string;
    duration_minutes: number;
  };
}

export default function TicketPage({ params }: TicketPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bookingId, setBookingId] = useState<string>('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Extract bookingId
  useEffect(() => {
    async function extractId() {
      if (params && typeof params === 'object') {
        if ('then' in params) {
          const resolved = await params;
          setBookingId(resolved.bookingId);
        } else if ('bookingId' in params) {
          setBookingId(params.bookingId);
        }
      }
    }
    extractId();
  }, [params]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch booking
  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId || !user) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            trip:trips(*)
          `)
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setBooking(data as any);
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError('Не можахме да заредим билета');
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId, user]);

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Зареждане...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Грешка</h3>
            <p className="text-gray-500 mb-6">{error || 'Билетът не е намерен'}</p>
            <Link href="/profile" className="btn-primary inline-block">
              Назад към профила
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const trip = booking.trip;
  const qrData = `TICKET:${booking.booking_reference}|${trip.from_city}-${trip.to_city}|${trip.departure_date}|${booking.passenger_name}`;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-primary-50/30 to-accent-50/20 py-8 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6 print:hidden">
          <Link
            href="/profile"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад към резервации
          </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Електронен билет</h1>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Изтегли / Принтирай</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-primary-500 print:border-2 print:shadow-none">
          <div className="bg-linear-to-r from-primary-600 to-accent-600 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">ЕЛЕКТРОНЕН БИЛЕТ</h2>
                <p className="text-primary-100">Валиден за качване</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm bg-white/20 px-3 py-1 rounded">
                  {booking.booking_reference}
                </div>
                <div className="text-xs mt-1 text-primary-100">
                  Код за резервация
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Пътник</h3>
                  <p className="text-2xl font-bold text-gray-900">{booking.passenger_name}</p>
                  <p className="text-gray-600">{booking.passenger_email}</p>
                  <p className="text-gray-600">{booking.passenger_phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Превоз</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{getTransportIcon(trip.transport_type as any)}</span>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {getTransportLabel(trip.transport_type as any)} - {trip.carrier}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-r from-primary-50 to-accent-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">{trip.from_city}</h3>
                      <p className="text-sm text-gray-600 mt-1">{trip.departure_location}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <Navigation className="w-8 h-8 text-primary-600 rotate-90" />
                      <div className="h-1 w-16 bg-primary-600 my-2"></div>
                    </div>
                    <div className="text-right">
                      <h3 className="text-3xl font-black text-gray-900">{trip.to_city}</h3>
                      <p className="text-sm text-gray-600 mt-1">{trip.arrival_location}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Дата</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(trip.departure_date).toLocaleDateString('bg-BG', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Тръгване</h3>
                    <p className="text-lg font-bold text-gray-900">{trip.departure_time}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Пристигане</h3>
                    <p className="text-lg font-bold text-gray-900">{trip.arrival_time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Места</h3>
                    <p className="text-2xl font-bold text-primary-600">
                      {booking.seats.join(', ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Обща цена</h3>
                    <p className="text-2xl font-bold text-accent-600">
                      {formatPrice(booking.total_price)}
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex flex-col items-center justify-end space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-center text-gray-500 max-w-50">
                  Сканирайте този код при качване
                </p>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                <p>Издаден на: {new Date(booking.created_at).toLocaleString('bg-BG')}</p>
              </div>
              <div className="text-right">
                <p>ПътуванеБГ · Дигитална транспортна платформа</p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 print:hidden">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Важно:</strong> Запазете този билет на телефона си или го принтирайте. Покажете QR кода на контрольора при качване.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}