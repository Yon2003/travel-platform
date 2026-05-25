import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const modes = searchParams.get('modes')?.split(',') || [];

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing from or to parameters' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('trips')
      .select('*')
      .eq('from_city', from)
      .eq('to_city', to);

    if (date) {
      query = query.eq('departure_date', date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('departure_date', today);
    }

    if (modes.length > 0) {
      query = query.in('transport_type', modes);
    }

    query = query
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });

    const { data: trips, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ trips: trips || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}