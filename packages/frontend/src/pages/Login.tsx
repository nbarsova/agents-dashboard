import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/me/analytics" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);
      navigate('/me/analytics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main">
      <div className="w-full max-w-sm rounded-lg border border-border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-text-primary">
          Agents Dashboard
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
