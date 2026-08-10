import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-md">
        <h2 className="mb-2 text-xl font-bold text-red-600">Authentication Error</h2>
        <p className="mb-6 text-sm text-gray-600">
          Sorry, we could not authenticate you. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}