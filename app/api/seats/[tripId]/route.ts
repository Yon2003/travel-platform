import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('seats, trip_id')
      .eq('trip_id', parseInt(tripId))
      .in('status', ['confirmed', 'pending']);

    if (error) throw error;

    const takenSeats = bookings?.flatMap(b => b.seats) || [];

    return NextResponse.json({ 
      takenSeats: takenSeats,
      bookedSeats: takenSeats
    });
  } catch (error) {
    console.error('Error fetching seat status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat status' },
      { status: 500 }
    );
  }
}