import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .order('name');

  if (error) return NextResponse.json({ cities: [] });
  return NextResponse.json({ cities: data });
}
