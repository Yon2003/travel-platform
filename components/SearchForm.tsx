'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Search } from 'lucide-react';
import { cities } from '@/lib/data';

export default function SearchForm() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [selectedModes, setSelectedModes] = useState({
    train: true,
    bus: true,
    minibus: true,
  });

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!from || !to || !date) {
      alert('Моля попълнете всички задължителни полета');
      return;
    }

    const modes = Object.entries(selectedModes)
      .filter(([_, selected]) => selected)
      .map(([mode]) => mode)
      .join(',');


    router.push(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&modes=${modes || 'train,bus,minibus'}`);
  };

  const toggleMode = (mode: 'train' | 'bus' | 'minibus') => {
    setSelectedModes((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="card max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Откъде *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="input-field pl-10"
                required
              >
                <option value="">Избери град</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Докъде *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input-field pl-10"
                required
              >
                <option value="">Избери град</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="input-field pl-10"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Транспорт
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'train' as const, label: '🚆 Влак' },
              { key: 'bus' as const, label: '🚌 Автобус' },
              { key: 'minibus' as const, label: '🚐 Бус' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleMode(key)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedModes[key]
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Търси пътувания</span>
        </button>
      </div>
    </form>
  );
}