'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Gift } from 'lucide-react';
import Link from 'next/link';

interface LoyaltyData {
    points: number;
    total_earned: number;
    level: string;
}

export default function LoyaltyPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [redeemError, setRedeemError] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [vouchers, setVouchers] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchLoyalty() {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('user_loyalty')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching loyalty:', error);
                }

                setLoyalty(data || { points: 0, total_earned: 0, level: 'none' });
            } catch (err) {
                console.error('Error:', err);
                setLoyalty({ points: 0, total_earned: 0, level: 'none' });
            } finally {
                setLoading(false);
            }
        }

        async function fetchVouchers() {
            if (!user) return;

            const { data } = await supabase
                .from('vouchers')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setVouchers(data);
            }
        }

        fetchLoyalty();
        fetchVouchers();
    }, [user]);

    const handleRedeem = async (discountPercent: number, pointsCost: number) => {
        if (!user || !loyalty) return;

        if (loyalty.points < pointsCost) {
            setRedeemError('Недостатъчно точки!');
            return;
        }

        if (!confirm(`Сигурен ли си? Ще изразходваш ${pointsCost} точки за ${discountPercent}% отстъпка купон.`)) {
            return;
        }

        setRedeeming(true);
        setRedeemError('');

        try {
            const response = await fetch('/api/vouchers/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    discountPercent,
                    pointsCost,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Грешка при генериране на купон');
            }

            alert(`🎉 Успешно! Вашият код: ${data.code}`);
            window.location.reload();
        } catch (err: any) {
            setRedeemError(err.message);
        } finally {
            setRedeeming(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Зареждане...
            </div>
        );
    }

    if (!loyalty || loyalty.total_earned === 0) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-primary-50/30 to-primary-50/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <div className="text-8xl mb-6">🎯</div>
                        <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-primary-600 to-primary-800">
                            Добре дошли в програмата за лоялност!
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Започнете да пътувате и събирайте точки за отстъпки при следващи резервации
                        </p>

                        <div className="card max-w-2xl mx-auto mb-8 text-left">
                            <h3 className="text-2xl font-bold mb-6 text-center">💡 Как работи?</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-bold">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Резервирайте пътуване</h4>
                                        <p className="text-gray-600">Всяка резервация ви донася точки: <strong>€1 = 1 точка</strong></p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-bold">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Събирайте точки</h4>
                                        <p className="text-gray-600">
                                            <strong>50 точки</strong> → размяна за 5% купон<br />
                                            <strong>100 точки</strong> → размяна за 10% купон<br />
                                            <strong>200 точки</strong> → размяна за 20% купон
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 font-bold">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">Размяна за купон</h4>
                                        <p className="text-gray-600">Размените точки за отстъпка купон и го използвайте при следваща резервация</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link href="/" className="btn-primary inline-block text-lg px-8 py-4">
                            🚀 Резервирай първо пътуване
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-primary-50/30 to-primary-50/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-linear-to-r from-primary-600 to-primary-800">
                        Лоялност Точки
                    </h1>
                    <p className="text-gray-600">Спестете при следващо пътуване</p>
                </div>

                <div className="card bg-linear-to-br from-blue-600 to-blue-800 text-white mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-9xl opacity-10">
                        🎯
                    </div>

                    <div className="relative z-10">
                        <div className="text-center mb-6">
                            <p className="text-white/80 text-sm mb-2">Вашите точки</p>
                            <h2 className="text-7xl font-black">{loyalty?.points || 0}</h2>
                        </div>

                        {(() => {
                            const points = loyalty?.points || 0;

                            if (points >= 200) {
                                return (
                                    <div className="text-center py-4">
                                        <p className="text-white text-lg font-semibold">🎉 Достигнахте максималното ниво!</p>
                                        <p className="text-white/80 text-sm">Можете да размените точки за 20% купон</p>
                                    </div>
                                );
                            }

                            if (points >= 100) {
                                const pointsToNext = 200 - points;
                                return (
                                    <div>
                                        <p className="text-white text-lg font-semibold text-center mb-3">
                                            🎉 Можете да размените за 10% купон!
                                        </p>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-white/90">Напредък към 20% купон</span>
                                            <span className="text-white/90 font-semibold">{points} / 200</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-white h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(points / 200) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-white/80 text-sm mt-2">
                                            Още {pointsToNext} точки до 20% купон!
                                        </p>
                                    </div>
                                );
                            }

                            if (points >= 50) {
                                const pointsToNext = 100 - points;
                                return (
                                    <div>
                                        <p className="text-white text-lg font-semibold text-center mb-3">
                                            ✅ Можете да размените за 5% купон!
                                        </p>
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-white/90">Напредък към 10% купон</span>
                                            <span className="text-white/90 font-semibold">{points} / 100</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-white h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(points / 100) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-white/80 text-sm mt-2">
                                            Още {pointsToNext} точки до 10% купон!
                                        </p>
                                    </div>
                                );
                            }

                            const pointsToNext = 50 - points;
                            return (
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-white/90">Напредък към 5% купон</span>
                                        <span className="text-white/90 font-semibold">{points} / 50</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-white h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(points / 50) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-white/80 text-sm mt-2">
                                        Още {pointsToNext} точки до 5% купон!
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="card mb-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                        <Gift className="w-6 h-6 text-primary-600" />
                        <span>Размени точки за купон</span>
                    </h3>

                    {redeemError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                            {redeemError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[
                            { discount: 5, cost: 50 },
                            { discount: 10, cost: 100 },
                            { discount: 20, cost: 200 },
                        ].map((offer) => {
                            const canRedeem = (loyalty?.points || 0) >= offer.cost;

                            return (
                                <div
                                    key={offer.discount}
                                    className={`border-2 rounded-xl p-6 text-center transition-all ${canRedeem
                                        ? 'border-primary-500 bg-primary-50 hover:shadow-lg'
                                        : 'border-gray-300 bg-gray-50 opacity-60'
                                        }`}
                                >
                                    <div className="text-4xl font-black text-primary-600 mb-2">
                                        {offer.discount}%
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">ОТСТЪПКА</p>
                                    <div className="text-lg font-semibold text-gray-700 mb-4">
                                        {offer.cost} точки
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(offer.discount, offer.cost)}
                                        disabled={!canRedeem || redeeming}
                                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${canRedeem
                                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {redeeming ? 'Обработка...' : canRedeem ? 'Размени' : 'Недостатъчно'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-sm text-gray-600 text-center">
                        💡 Купоните са валидни 30 дни след издаване
                    </p>
                </div>

                {vouchers.length > 0 && (
                    <div className="card mb-8">
                        <h3 className="text-xl font-bold mb-4">🎫 Моите купони</h3>
                        <div className="space-y-3">
                            {vouchers.map((voucher) => {
                                const isExpired = new Date(voucher.expires_at) < new Date();
                                const isUsed = voucher.is_used;

                                return (
                                    <div
                                        key={voucher.id}
                                        className={`border-2 rounded-lg p-4 ${isUsed || isExpired
                                            ? 'border-gray-300 bg-gray-50 opacity-60'
                                            : 'border-primary-500 bg-primary-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-mono text-lg font-bold text-gray-900">
                                                    {voucher.code}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {voucher.discount_percent}% отстъпка
                                                </p>
                                            </div>

                                            {!isUsed && !isExpired && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(voucher.code);
                                                    }}
                                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold mr-4"
                                                >
                                                    📋 Копирай
                                                </button>
                                            )}

                                            <div className="text-right">
                                                {isUsed ? (
                                                    <span className="text-sm text-gray-500">✓ Използван</span>
                                                ) : isExpired ? (
                                                    <span className="text-sm text-red-600">⏰ Изтекъл</span>
                                                ) : (
                                                    <span className="text-sm text-green-600 font-semibold">
                                                        ✓ Активен
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    До {new Date(voucher.expires_at).toLocaleDateString('bg-BG')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="card">
                    <h3 className="text-xl font-bold mb-4">💡 Как работи?</h3>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start space-x-2">
                            <span className="text-primary-600 font-bold">1.</span>
                            <span>Всяка резервация ви донася точки: <strong>€1 = 1 точка</strong></span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-primary-600 font-bold">2.</span>
                            <span>Размените точки за отстъпка купон с избраната от вас стойност</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-primary-600 font-bold">3.</span>
                            <span>Приложете купона при следваща резервация за отстъпка</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="btn-primary inline-block">
                        Резервирай пътуване
                    </Link>
                </div>

            </div>
        </div>
    );
}