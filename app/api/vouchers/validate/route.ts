import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Липсва код или потребител' },
        { status: 400 }
      );
    }

    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('user_id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Невалиден код' },
        { status: 404 }
      );
    }

    if (!voucher) {
      return NextResponse.json(
        { error: 'Невалиден код' },
        { status: 404 }
      );
    }

    if (voucher.is_used) {
      return NextResponse.json(
        { error: 'Кодът вече е използван' },
        { status: 400 }
      );
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Кодът е изтекъл' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      discount: voucher.discount_percent,
      voucherId: voucher.id,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Грешка при проверка на купон' },
      { status: 500 }
    );
  }
}
