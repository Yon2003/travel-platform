'use client';
import Link from 'next/link';
import { User, BookMarked, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🚆</span>
            <span className="text-xl font-bold text-primary-600">
              ПътуванеБГ
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <BookMarked className="w-5 h-5" />
                  <span className="hidden sm:inline">Резервации</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Профил</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Изход</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Вход
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}