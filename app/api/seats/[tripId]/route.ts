import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;

    // Изтрий изтекли резервации
    await supabase
      .from('seat_reservations')
      .delete()
      .lt('reserved_until', new Date().toISOString());

    // Вземи всички активни временни резервации
    const { data: reservations, error } = await supabase
      .from('seat_reservations')
      .select('seat_number')
      .eq('trip_id', tripId)
      .gt('reserved_until', new Date().toISOString());

    if (error) throw error;

    // Вземи всички ПОТВЪРДЕНИ резервации от bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('seats')
      .eq('trip_id', tripId)
      .in('status', ['confirmed', 'pending']); // И confirmed И pending

    if (bookingsError) throw bookingsError;

    // Събери всички заети места
    const tempReservedSeats = reservations?.map(r => r.seat_number) || [];
    const permanentBookedSeats = bookings?.flatMap(b => b.seats) || [];
    const allTakenSeats = [...new Set([...tempReservedSeats, ...permanentBookedSeats])];

    return NextResponse.json({ 
      takenSeats: allTakenSeats,
      reservedSeats: tempReservedSeats,
      bookedSeats: permanentBookedSeats
    });
  } catch (error) {
    console.error('Error fetching seat status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat status' },
      { status: 500 }
    );
  }
}