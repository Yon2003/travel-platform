import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { tripId, seats, userId } = await request.json();

        if (!tripId || !seats || !Array.isArray(seats) || seats.length === 0 || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        await supabase
            .from('seat_reservations')
            .delete()
            .lt('reserved_until', now);

        const [tempResult, bookResult] = await Promise.all([
            supabase
                .from('seat_reservations')
                .select('seat_number')
                .eq('trip_id', tripId)
                .in('seat_number', seats)
                .neq('user_id', userId)
                .gt('reserved_until', now),
            supabase
                .from('bookings')
                .select('seats')
                .eq('trip_id', tripId)
                .in('status', ['confirmed', 'pending', 'validated']),
        ]);

        if (tempResult.error) throw tempResult.error;
        if (bookResult.error) throw bookResult.error;

        const tempTaken = tempResult.data?.map(r => r.seat_number) || [];
        const permTaken = bookResult.data?.flatMap(b => b.seats).filter((s: number) => seats.includes(s)) || [];
        const allTaken = [...new Set([...tempTaken, ...permTaken])];

        if (allTaken.length > 0) {
            return NextResponse.json(
                { error: 'Some seats are already taken', takenSeats: allTaken },
                { status: 409 }
            );
        }

        const reservedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const reservations = seats.map((seatNumber: number) => ({
            trip_id: tripId,
            seat_number: seatNumber,
            user_id: userId,
            reserved_until: reservedUntil,
        }));

        const { error: insertError } = await supabase
            .from('seat_reservations')
            .insert(reservations);

        if (insertError) {
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { error: 'Some seats are already taken' },
                    { status: 409 }
                );
            }
            throw insertError;
        }

        return NextResponse.json({ success: true, reservedUntil, seats });
    } catch (error) {
        console.error('Error reserving seats:', error);
        return NextResponse.json(
            { error: 'Failed to reserve seats' },
            { status: 500 }
        );
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const { tripId, userId } = await request.json();

        if (!tripId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('seat_reservations')
            .delete()
            .eq('trip_id', tripId)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting reservations:', error);
        return NextResponse.json(
            { error: 'Failed to delete reservations' },
            { status: 500 }
        );
    }
}