import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date'); // Дата от формата (ако потребителят е избрал)
    const modes = searchParams.get('modes')?.split(',') || [];

    console.log('=== API SEARCH DEBUG ===');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Date:', date);
    console.log('Date type:', typeof date);
    console.log('Modes:', modes);
    console.log('======================');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing from or to parameters' },
        { status: 400 }
      );
    }

    // Започни query
    let query = supabase
      .from('trips')
      .select('*')
      .eq('from_city', from)
      .eq('to_city', to);

    // АКО има избрана дата - търси САМО за тази дата
    if (date) {
      console.log('🔍 Searching for date:', date); // DEBUG
      query = query.eq('departure_date', date);
    } else {
      // АКО няма дата - покажи само бъдещи
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('departure_date', today);
    }

    if (date) {
      console.log('✅ Using specific date:', date);
      query = query.eq('departure_date', date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      console.log('⏰ Using date range from:', today);
      query = query.gte('departure_date', today);
    }

    // Филтър по тип транспорт
    if (modes.length > 0) {
      query = query.in('transport_type', modes);
    }

    // Сортирай по дата и час
    query = query
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });

    // Изпълни query-то
    const { data: trips, error } = await query;

    // ДОБАВИ ТОВА:
    console.log('📊 Found trips:', trips?.length || 0);
    if (trips && trips.length > 0) {
      console.log('First trip date:', trips[0].departure_date);
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trips: trips || [] });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}