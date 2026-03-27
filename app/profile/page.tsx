'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, User, Phone, MapPin, Calendar, BookMarked } from 'lucide-react';
import { cities } from '@/lib/data';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await updateProfile({ full_name: fullName, phone, city });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Грешка при запазване');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Зареждане...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Моят Профил</h1>
          </div>

          <div className="space-y-2 text-gray-600 text-sm mb-6 pb-6 border-b">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Член от: {new Date(user.created_at).toLocaleDateString('bg-BG')}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Пълно име
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Телефон
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="0888 123 456"
                pattern="^(\+359|0)[0-9]{9}$"
                title="Формат: 0888123456 или +359888123456"
              />
              <p className="text-xs text-gray-500 mt-1">Формат: 0888123456 или +359888123456</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Град
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
              >
                <option value="">Избери град</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                ✅ Профилът е запазен успешно!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Запазване...' : 'Запази промените'}
            </button>
          </form>
        </div>

        <div className="card text-center">
          <BookMarked className="w-8 h-8 text-primary-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Моите резервации</h2>
          <p className="text-gray-500 text-sm mb-4">Вижте всичките си направени резервации и билети</p>
          <Link href="/bookings" className="btn-primary inline-block">
            Към резервациите
          </Link>
        </div>

      </div>
    </div>
  );
}
