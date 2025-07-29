// components/ErrorFallback.tsx

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function AppUnavaliable({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-100 to-indigo-100 text-gray-800 px-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-xl w-full">
        <h1 className="text-3xl font-bold text-rose-600 mb-4">
          Something went wrong.
        </h1>
        <p className="mb-2 text-lg">
          We're sorry! An unexpected error has occurred.
        </p>
        <pre className="text-sm text-gray-500 overflow-auto bg-gray-100 rounded-lg p-4 max-h-40">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="mt-6 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
