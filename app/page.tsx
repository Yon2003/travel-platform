import SearchForm from '@/components/SearchForm';
import Link from 'next/link';

export default function Home() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-[calc(100vh-4rem)]">

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium tracking-widest uppercase text-primary-200 mb-4">
            ✦ Българска Транспортна Мрежа ✦
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Планирай пътуването си лесно
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8">
            Влакове, автобуси и бусове на едно място
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-16">
        <SearchForm />
      </div>

      {/* Защо ние */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Защо да изберете нас?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Лесно търсене</h3>
              <p className="text-gray-600">
                Намерете всички опции за вашето пътуване на едно място
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Добри цени</h3>
              <p className="text-gray-600">
                Сравнете цените и изберете най-добрата опция за вас
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Бърза резервация</h3>
              <p className="text-gray-600">
                Резервирайте билета си за секунди
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Популярни маршрути */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Популярни маршрути
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { from: 'София', to: 'Пловдив', price: '12', time: '2ч 30м' },
              { from: 'София', to: 'Варна', price: '28', time: '6ч' },
              { from: 'София', to: 'Бургас', price: '27', time: '6ч' },
              { from: 'София', to: 'Пазарджик', price: '8', time: '1ч 30м' },
              { from: 'Пловдив', to: 'Бургас', price: '18', time: '3ч' },
              { from: 'Варна', to: 'Бургас', price: '15', time: '2ч' },
            ].map((route, idx) => (
              <Link
                key={idx}
                href={`/search?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&date=${today}&modes=train,bus,minibus`}
                className="card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                      {route.from} → {route.to}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      от {route.price} лв · {route.time}
                    </div>
                  </div>
                  <div className="text-3xl">🚆</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}