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

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const departure = new Date(trip.departure_date); departure.setHours(0, 0, 0, 0);
  const isExpired = departure < today;

  const statusColor = booking.status === 'cancelled' ? '#dc2626' : isExpired ? '#6b7280' : booking.status === 'validated' ? '#16a34a' : '#0284c7';
  const statusLabel = booking.status === 'cancelled' ? '✗ Анулиран' : isExpired ? '⏱ Изтекъл' : booking.status === 'validated' ? '✓ Валидиран' : '● Активен';

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white">
      <div className="max-w-3xl mx-auto px-4">

        {/* Toolbar */}
        <div className="mb-6 print:hidden flex items-center justify-between">
          <Link href="/profile" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft className="w-5 h-5 mr-1" />
            Назад
          </Link>
          <button onClick={handlePrint} className="btn-primary flex items-center space-x-2 text-sm px-4 py-2">
            <Download className="w-4 h-4" />
            <span>Принтирай</span>
          </button>
        </div>

        {/* Ticket */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="p-6 relative overflow-hidden print:border-b-2 print:border-gray-300" style={{background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact'}}>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 bg-white"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color: '#bfdbfe'}}>ПътуванеБГ</p>
                <h2 className="text-2xl font-black text-white">ЕЛЕКТРОНЕН БИЛЕТ</h2>
                <span className="inline-block mt-2 text-xs font-bold px-2 py-1 rounded-full text-white" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                  {statusLabel}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{color: '#bfdbfe'}}>Референтен код</p>
                <div className="font-mono font-bold text-lg px-3 py-1 rounded-lg tracking-widest text-white" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                  {booking.booking_reference}
                </div>
              </div>
            </div>
          </div>

          {/* Route strip */}
          <div className="bg-primary-50 px-4 sm:px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xl sm:text-3xl font-black text-gray-900 truncate">{trip.from_city}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{trip.departure_location}</p>
                <p className="text-lg sm:text-2xl font-bold text-primary-600 mt-1">{trip.departure_time}</p>
              </div>
              <div className="flex flex-col items-center px-2 sm:px-4 shrink-0">
                <span className="text-xl sm:text-2xl">{getTransportIcon(trip.transport_type as any)}</span>
                <div className="flex items-center my-2">
                  <div className="w-2 sm:w-4 h-0.5 bg-gray-400"></div>
                  <div className="w-8 sm:w-16 h-0.5 bg-primary-400 mx-1"></div>
                  <div className="w-2 sm:w-4 h-0.5 bg-gray-400"></div>
                </div>
                <p className="text-xs text-gray-500">{Math.floor(trip.duration_minutes / 60)}ч {trip.duration_minutes % 60}м</p>
              </div>
              <div className="text-right min-w-0">
                <p className="text-xl sm:text-3xl font-black text-gray-900 truncate">{trip.to_city}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{trip.arrival_location}</p>
                <p className="text-lg sm:text-2xl font-bold text-primary-600 mt-1">{trip.arrival_time}</p>
              </div>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="flex items-center px-4">
            <div className="w-6 h-6 rounded-full bg-gray-100 -ml-7 shrink-0 border border-gray-200"></div>
            <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2"></div>
            <div className="w-6 h-6 rounded-full bg-gray-100 -mr-7 shrink-0 border border-gray-200"></div>
          </div>

          {/* Details + QR */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Пътник</p>
                <p className="text-lg font-bold text-gray-900">{booking.passenger_name}</p>
                <p className="text-sm text-gray-500">{booking.passenger_email}</p>
                <p className="text-sm text-gray-500">{booking.passenger_phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Дата</p>
                  <p className="font-bold text-gray-900">
                    {new Date(trip.departure_date).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Превозвач</p>
                  <p className="font-bold text-gray-900">{trip.carrier}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Места</p>
                  <p className="text-xl font-black text-primary-600">{booking.seats.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Цена</p>
                  <p className="text-xl font-black text-gray-900">{formatPrice(booking.total_price)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 rounded-xl shadow-md border-2 border-gray-100">
                <QRCodeSVG value={qrData} size={160} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-center text-gray-400">Покажи на контрольора при качване</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
            <span>Издаден: {new Date(booking.created_at).toLocaleString('bg-BG')}</span>
            <span>ПътуванеБГ</span>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded print:hidden">
          <p className="text-sm text-blue-700">
            <strong>Важно:</strong> Запазете този билет или го принтирайте. Покажете QR кода на контрольора при качване.
          </p>
        </div>

      </div>
    </div>
  );
}