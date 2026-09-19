import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <h1 className="text-3xl font-bold text-[#171717] mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-6">Sorry, the page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-block bg-[#087F5B] text-white px-4 py-2 rounded-md hover:bg-[#087F5B]/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
