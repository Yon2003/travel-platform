export default function SearchLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
