import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-dark text-white gap-6 px-4">
      <h1 className="text-7xl font-bold text-orange leading-none">404</h1>
      <h2 className="text-2xl font-semibold text-orange-light">Page Not Found</h2>
      <p className="text-gray-400 text-center max-w-md">
        Looks like this page doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-orange text-white font-semibold text-center
                     hover:bg-orange-bright transition-colors duration-200
                     focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
        >
          Back to Home
        </Link>
        <Link
          href="/#features"
          className="px-6 py-3 rounded-lg border border-orange text-orange font-semibold text-center
                     hover:bg-orange/10 transition-colors duration-200
                     focus-visible:ring-2 focus-visible:ring-orange focus-visible:outline-none"
        >
          View Features
        </Link>
      </div>
    </main>
  );
}
