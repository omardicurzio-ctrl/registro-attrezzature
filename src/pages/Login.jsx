import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    const from = location.state?.from?.pathname || '/attrezzature';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) setError('Credenziali non valide.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-bordeaux">Registro Attrezzature</h1>
          <p className="text-sm text-stone-500 mt-1">Di Curzio Hospitality &middot; accesso staff</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-stone-500 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-500 mb-1">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md text-sm font-medium text-white bg-bordeaux hover:bg-bordeaux-dark disabled:opacity-60"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        <p className="text-xs text-stone-400 text-center mt-6">
          Le credenziali vengono create dall&apos;amministratore nel pannello Supabase
          (Authentication &rarr; Users).
        </p>
      </div>
    </div>
  );
}
