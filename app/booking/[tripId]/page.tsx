'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Trip } from '@/types';
import { formatDuration, formatPrice, getTransportIcon, getTransportLabel } from '@/lib/utils';
import { ArrowLeft, Clock, MapPin, User, Mail, Phone, CreditCard } from 'lucide-react';
import SeatSelector from '@/components/booking/SeatSelector';
import Link from 'next/link';


interface BookingPageProps {
  params: {
    tripId: string;
  };
}

export default function BookingPage({ params }: BookingPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tripId, setTripId] = useState<string>('');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingReference, setBookingReference] = useState('');

  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [numSeats, setNumSeats] = useState(1);

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [showSeatSelector, setShowSeatSelector] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);

  useEffect(() => {
    async function extractTripId() {
      if (params && typeof params === 'object') {
        if ('then' in params) {
          const resolved = await params;
          setTripId(resolved.tripId);
        } else if ('tripId' in params) {

          setTripId(params.tripId);
        }
      }
    }
    extractTripId();
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchTrip() {
      if (!tripId) return;

      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (error) throw error;

        if (data) {
          const formattedTrip: Trip = {
            id: data.id,
            from: data.from_city,
            to: data.to_city,
            type: data.transport_type,
            departureTime: data.departure_time,
            arrivalTime: data.arrival_time,
            duration: data.duration_minutes,
            price: parseFloat(data.price),
            carrier: data.carrier,
            departureLocation: data.departure_location,
            arrivalLocation: data.arrival_location,
            availableSeats: data.available_seats,
          };
          setTrip(formattedTrip);
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError('Грешка при зареждане на курса');
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [tripId]);

  useEffect(() => {
    if (user?.email) {
      setPassengerEmail(user.email);
    }
  }, [user]);

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Моля въведете код');
      return;
    }

    setCheckingVoucher(true);
    setVoucherError('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode.toUpperCase(),
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Невалиден код');
      }

      setVoucherDiscount(data.discount / 100);
      setAppliedVoucherId(data.voucherId);
      setVoucherError('');
      alert(`✅ Купонът е приложен! ${data.discount}% отстъпка`);
    } catch (err: any) {
      setVoucherError(err.message);
      setVoucherDiscount(0);
      setAppliedVoucherId(null);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !trip) return;

    setSubmitting(true);
    setError('');

    try {
      if (selectedSeats.length > 0) {
        const checkResponse = await fetch(`/api/seats/${trip.id}`);
        const checkData = await checkResponse.json();

        const alreadyTaken = selectedSeats.filter(s => checkData.takenSeats.includes(s));

        if (alreadyTaken.length > 0) {
          setError(`Места ${alreadyTaken.join(', ')} вече са заети! Моля изберете други места.`);
          setSubmitting(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          trip_id: trip.id,
          seats: selectedSeats.length > 0 ? selectedSeats : Array.from({ length: numSeats }, (_, i) => i + 1),
          num_seats: numSeats,
          total_price: trip.price * numSeats * (1 - voucherDiscount),
          status: 'confirmed',
          passenger_name: passengerName,
          passenger_email: passengerEmail,
          passenger_phone: passengerPhone,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await supabase
          .from('trips')
          .update({
            available_seats: trip.availableSeats - numSeats
          })
          .eq('id', trip.id);

        const pointsEarned = Math.floor(trip.price * numSeats);
        await supabase.rpc('add_loyalty_points', {
          p_user_id: user.id,
          p_points: pointsEarned
        });

        if (appliedVoucherId) {
          await supabase
            .from('vouchers')
            .update({
              is_used: true,
              used_at: new Date().toISOString()
            })
            .eq('id', appliedVoucherId);
        }

        setBookingReference(data.booking_reference);
      }
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Грешка при създаване на резервация');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Зареждане...
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Грешка</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Link href="/" className="btn-primary inline-block">
              Начална страница
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  if (bookingReference) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Резервацията е успешна!
            </h1>
            <div className="bg-primary-50 border-2 border-primary-600 rounded-lg p-6 mb-6 inline-block">
              <p className="text-sm text-gray-600 mb-2">Вашият код за резервация:</p>
              <p className="text-3xl font-bold text-primary-600 font-mono">
                {bookingReference}
              </p>
            </div>
            <p className="text-gray-600 mb-8">
              Изпратихме потвърждение на <strong>{passengerEmail}</strong>
            </p>
            <div className="bg-accent-50 border-2 border-accent-600 rounded-lg p-4 mb-6 inline-block">
              <p className="text-sm text-gray-600 mb-1">🎯 Спечелихте точки!</p>
              <p className="text-2xl font-bold text-accent-600">
                +{Math.floor(trip.price * numSeats)} точки
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/profile" className="btn-primary inline-block">
                Виж моите резервации
              </Link>
              <br />
              <Link href="/" className="text-primary-600 hover:underline">
                Начална страница
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/search"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад към резултатите
        </Link>

        <h1 className="text-3xl font-bold mb-8">Резервация на билет</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Детайли на курса</h2>
              <div className="flex items-start space-x-4">
                <span className="text-4xl">{getTransportIcon(trip.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {getTransportLabel(trip.type)} - {trip.carrier}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {trip.from} ({trip.departureTime}) → {trip.to} ({trip.arrivalTime})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(trip.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Данни за пътник</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Пълно име *
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="input-field"
                    required
                    placeholder="Иван Иванов"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    className="input-field"
                    required
                    placeholder="ivan@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="input-field"
                    required
                    placeholder="0888 123 456 или +359 888 123 456"
                    pattern="^(\+359|0)[0-9]{9}$"
                    title="Моля въведете валиден български телефонен номер (напр. 0888123456 или +359888123456)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Формат: 0888123456 или +359888123456
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎫 Промо код (опционално)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="input-field flex-1 min-w-0"
                      placeholder="VC-XXXXXXXX"
                      disabled={voucherDiscount > 0}
                    />
                    {voucherDiscount === 0 ? (
                      <button
                        type="button"
                        onClick={handleCheckVoucher}
                        disabled={checkingVoucher || !voucherCode.trim()}
                        className="btn-primary px-4 sm:px-6 shrink-0"
                      >
                        {checkingVoucher ? 'Проверка...' : 'Приложи'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCode('');
                          setVoucherDiscount(0);
                          setAppliedVoucherId(null);
                          setVoucherError('');
                        }}
                        className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shrink-0"
                      >
                        Премахни
                      </button>
                    )}
                  </div>

                  {voucherError && (
                    <p className="text-sm text-red-600 mt-2">{voucherError}</p>
                  )}

                  {voucherDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-2 font-semibold">
                      ✅ Приложена {Math.round(voucherDiscount * 100)}% отстъпка
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Брой билети
                  </label>

                  {!showSeatSelector ? (
                    <>
                      <select
                        value={numSeats}
                        onChange={(e) => {
                          const newNum = parseInt(e.target.value);
                          setNumSeats(newNum);
                          setSelectedSeats([]);
                        }}
                        className="input-field"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'билет' : 'билета'}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        Налични места: {trip.availableSeats}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSeatSelector(true)}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
                      >
                        💺 Избери конкретни места
                      </button>
                    </>
                  ) : (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSeatSelector(false);
                          setSelectedSeats([]);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 mb-4"
                      >
                        ← Назад към избор на брой
                      </button>
                      <SeatSelector
                        tripId={trip.id}
                        totalSeats={trip.availableSeats}
                        transportType={trip.type}
                        onSeatsSelected={(seats) => {
                          setSelectedSeats(seats);
                          setNumSeats(seats.length);
                        }}
                        maxSeats={5}
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{submitting ? 'Обработка...' : 'Потвърди резервация'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="card lg:sticky lg:top-4">
              <h2 className="text-xl font-semibold mb-4">Обобщение</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Цена за билет:</span>
                  <span className="font-semibold">{formatPrice(trip.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Брой билети:</span>
                  <span className="font-semibold">{numSeats}</span>
                </div>

                {voucherDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Междинна сума:</span>
                      <span className="font-semibold">{formatPrice(trip.price * numSeats)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-semibold">Отстъпка ({Math.round(voucherDiscount * 100)}%):</span>
                      <span className="font-semibold">-{formatPrice(trip.price * numSeats * voucherDiscount)}</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Обща сума:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(trip.price * numSeats * (1 - voucherDiscount))}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p className="mt-2">📧 Ще получите потвърждение на email</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}