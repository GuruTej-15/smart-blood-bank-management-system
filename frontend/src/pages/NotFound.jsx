import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-lg rounded-3xl border border-stone bg-white p-8 text-center shadow-sm">
        <h1 className="text-5xl font-bold text-ink">404</h1>
        <p className="mt-4 text-lg text-muted">Page not found.</p>
        <p className="mt-2 text-sm text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-crimson px-5 py-3 text-sm font-semibold text-white transition hover:bg-crimson-dark"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
