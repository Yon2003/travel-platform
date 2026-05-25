import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Страницата не е намерена</h1>
        <p className="text-gray-600 mb-8">Страницата, която търсите, не съществува или е преместена.</p>
        <Link href="/" className="btn-primary">
          Към началната страница
        </Link>
      </div>
    </div>
  );
}
