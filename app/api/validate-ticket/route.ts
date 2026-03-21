import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dspnykzmircudrxrzear.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7kpem7juuHv5BB9LEa2TEQ_oGGamRcZ';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { booking_reference } = body;

  if (!booking_reference || typeof booking_reference !== 'string') {
    return NextResponse.json({ valid: false, reason: 'Не е предоставен референтен код.' }, { status: 400 });
  }

  const ref = booking_reference.toUpperCase().trim();

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, trip:trips(*)')
    .eq('booking_reference', ref)
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'Билетът не е намерен в системата.' });
  }

  if (data.status === 'cancelled') {
    return NextResponse.json({ valid: false, reason: 'Билетът е анулиран.' });
  }

  if (data.status === 'validated') {
    return NextResponse.json({ valid: false, reason: 'Билетът вече е валидиран.' });
  }

  // Mark as validated
  await supabaseAdmin
    .from('bookings')
    .update({ status: 'validated' })
    .eq('id', data.id);

  const trip = data.trip;
  const transportMap: Record<string, string> = {
    train: 'Влак',
    bus: 'Автобус',
    minibus: 'Миниавтобус',
  };
  const transportLabel = transportMap[trip.transport_type] ?? trip.transport_type;

  const d = new Date(trip.departure_date);
  const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  const seats = Array.isArray(data.seats) ? data.seats.join(', ') : String(data.seats ?? '');
  const price = `€${Number(data.total_price).toFixed(2)}`;
  const validatedAt = new Date().toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });

  return NextResponse.json({
    valid: true,
    ticket: {
      refCode: data.booking_reference,
      passengerName: data.passenger_name,
      transport: `${transportLabel} - ${trip.carrier}`,
      route: `${trip.from_city} → ${trip.to_city}`,
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time,
      seats,
      price,
      date: dateStr,
      used: false,
      validatedAt,
    },
  });
}
