import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, discountPercent, pointsCost } = await request.json();

    if (!userId || !discountPercent || !pointsCost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Провери валидност
    if (![5, 10, 20].includes(discountPercent)) {
      return NextResponse.json(
        { error: 'Invalid discount percent' },
        { status: 400 }
      );
    }

    // Генерирай купон
    const { data, error } = await supabase.rpc('generate_voucher', {
      p_user_id: userId,
      p_discount_percent: discountPercent,
      p_points_cost: pointsCost,
    });

    if (error) {
      console.error('Supabase error:', error);
      if (error.message.includes('Insufficient points')) {
        return NextResponse.json(
          { error: 'Недостатъчно точки' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ code: data });
  } catch (error: any) {
    console.error('Error generating voucher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate voucher' },
      { status: 500 }
    );
  }
}