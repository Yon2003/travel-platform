'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Нещо се обърка</h1>
        <p className="text-gray-600 mb-8">
          {error.message || 'Възникна неочаквана грешка. Моля, опитайте отново.'}
        </p>
        <button onClick={reset} className="btn-primary">
          Опитай отново
        </button>
      </div>
    </div>
  );
}
