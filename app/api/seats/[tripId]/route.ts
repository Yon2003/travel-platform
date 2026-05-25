import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;
    const now = new Date().toISOString();

    await supabase
      .from('seat_reservations')
      .delete()
      .lt('reserved_until', now);

    const [bookingsResult, tempResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('seats')
        .eq('trip_id', parseInt(tripId))
        .in('status', ['confirmed', 'pending', 'validated']),
      supabase
        .from('seat_reservations')
        .select('seat_number')
        .eq('trip_id', tripId)
        .gt('reserved_until', now),
    ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (tempResult.error) throw tempResult.error;

    const bookedSeats = bookingsResult.data?.flatMap(b => b.seats) || [];
    const tempSeats = tempResult.data?.map(r => r.seat_number) || [];
    const takenSeats = [...new Set([...bookedSeats, ...tempSeats])];

    return NextResponse.json({ takenSeats, bookedSeats: takenSeats });
  } catch (error) {
    console.error('Error fetching seat status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat status' },
      { status: 500 }
    );
  }
}