import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Ошибка регистрации');
      }
      const data = await res.json();
      login(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-800/50 glass-effect p-8 shadow-2xl shadow-black/40 animate-scale-in">
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Регистрация
          </span>
        </h1>
        <p className="text-sm text-slate-300">
          Создайте аккаунт для сохранения избранных объявлений.
        </p>
      </div>

      <form className="space-y-5 animate-fade-in-up animate-delay-200" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-cyan-400">👤</span>
            Имя
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:border-indigo-500/50 focus:ring-indigo-500/30 focus:bg-slate-900/70 transition-all duration-300"
            placeholder="Ваше имя"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-cyan-400">📧</span>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:border-indigo-500/50 focus:ring-indigo-500/30 focus:bg-slate-900/70 transition-all duration-300"
            placeholder="your@email.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-cyan-400">🔒</span>
            Пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:border-indigo-500/50 focus:ring-indigo-500/30 focus:bg-slate-900/70 transition-all duration-300"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-sm text-red-200 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-violet-500/70 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] hover:from-blue-400 hover:via-violet-400 hover:to-fuchsia-400"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span>
              Создаём аккаунт…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              ✨ Зарегистрироваться
            </span>
          )}
          {!loading && <span className="absolute inset-0 shimmer"></span>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400 animate-fade-in-up animate-delay-300">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
          Войти →
        </Link>
      </p>
    </div>
  );
}


