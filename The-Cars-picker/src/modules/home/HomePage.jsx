import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nlpRes = await fetch(`${API_BASE}/api/nlp/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!nlpRes.ok) {
        const body = await nlpRes.json().catch(() => ({}));
        throw new Error(body.message || 'Ошибка парсинга запроса');
      }
      const nlp = await nlpRes.json();
      setFilters(nlp.filters);
      const searchRes = await fetch(`${API_BASE}/api/cars/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: nlp.filters }),
      });
      if (!searchRes.ok) {
        const body = await searchRes.json().catch(() => ({}));
        throw new Error(body.message || 'Ошибка поиска автомобилей');
      }
      const search = await searchRes.json();
      setResults(search.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative rounded-3xl border border-slate-800/50 glass-effect p-8 shadow-2xl shadow-black/40 overflow-hidden animate-fade-in-up">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-violet-500/15 to-fuchsia-500/15 animate-pulse"></div>
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6 animate-slide-in-right">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  Подбор машины
                </span>
                <br />
                <span className="text-slate-100">по обычному человеческому запросу</span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Опишите словами, какую машину вы хотите, а прототип переведёт это
                в фильтры поиска и подберёт варианты из каталога.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 stagger-animation">
              <span className="rounded-full border border-blue-500/50 bg-blue-500/20 px-4 py-1.5 text-xs text-blue-200 backdrop-blur-sm shadow-lg shadow-blue-500/20">
                ✨ NLP → фильтры
              </span>
              <span className="rounded-full border border-violet-500/50 bg-violet-500/20 px-4 py-1.5 text-xs text-violet-200 backdrop-blur-sm shadow-lg shadow-violet-500/20">
                🚀 REST API
              </span>
              <span className="rounded-full border border-fuchsia-500/50 bg-fuchsia-500/20 px-4 py-1.5 text-xs text-fuchsia-200 backdrop-blur-sm shadow-lg shadow-fuchsia-500/20">
                ⚡ React + Tailwind
              </span>
            </div>
          </div>
          <div className="w-full max-w-md flex-1 rounded-2xl border border-slate-700/50 glass-effect p-6 shadow-xl animate-scale-in">
            <form onSubmit={handleSearch} className="space-y-4">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span className="text-cyan-400">💬</span>
                Опишите желаемую машину
              </label>
              <textarea
                placeholder='например "премиальная быстрая машина до 3 млн"'
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:border-cyan-500/50 focus:ring-cyan-500/30 focus:bg-slate-900/70 transition-all duration-300"
              />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-violet-500/70 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] hover:from-blue-400 hover:via-violet-400 hover:to-fuchsia-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Подбираем варианты…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🔍 Подобрать машины
                  </span>
                )}
                {!loading && <span className="absolute inset-0 shimmer"></span>}
              </button>
            </form>
          </div>
        </div>
      </section>

      {filters && (
        <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-violet-500/15 backdrop-blur-sm p-6 text-xs text-slate-200 animate-fade-in-up animate-delay-200 shadow-lg shadow-cyan-500/20">
          <div className="mb-4 font-bold text-sm flex items-center gap-2">
            <span className="text-cyan-400">🎯</span>
            Распознанные фильтры:
          </div>
          <div className="flex flex-wrap gap-3 stagger-animation">
            {filters.price_max && (
              <span className="rounded-full border border-emerald-500/60 bg-emerald-500/25 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
                💰 Цена до {filters.price_max.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {filters.price_min && (
              <span className="rounded-full border border-yellow-500/60 bg-yellow-500/25 px-4 py-2 text-xs font-medium text-yellow-200 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-yellow-500/20">
                💎 Цена от {filters.price_min.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {filters.body_type?.length > 0 && (
              <span className="rounded-full border border-fuchsia-500/60 bg-fuchsia-500/25 px-4 py-2 text-xs font-medium text-fuchsia-200 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-fuchsia-500/20">
                🚗 {filters.body_type.join(', ')}
              </span>
            )}
            {filters.tags?.length > 0 && (
              <span className="rounded-full border border-orange-500/60 bg-orange-500/25 px-4 py-2 text-xs font-medium text-orange-200 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-orange-500/20">
                🏷️ {filters.tags.join(', ')}
              </span>
            )}
            {filters.brands?.length > 0 && (
              <span className="rounded-full border border-cyan-500/60 bg-cyan-500/25 px-4 py-2 text-xs font-medium text-cyan-200 backdrop-blur-sm hover:scale-105 transition-transform duration-300 shadow-lg shadow-cyan-500/20">
                🏭 {filters.brands.join(', ')}
              </span>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Подходящие варианты</h2>
          <Link
            to="/catalog"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Открыть весь каталог →
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="text-sm text-slate-400">
            Пока нет результатов. Введите запрос выше и нажмите «Подобрать машины».
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
          {results.map((car, index) => (
            <Link
              key={car.id}
              to={`/cars/${car.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/50 glass-effect shadow-xl shadow-black/40 card-hover animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-48 w-full overflow-hidden">
                {car.image ? (
                  <>
                    <img
                      src={car.image}
                      alt={car.title}
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-xs text-slate-400">
                    Нет фото
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-slate-100 border border-white/10">
                  📍 {car.city}
                </span>
                <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-blue-500/90 via-violet-500/90 to-fuchsia-500/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg shadow-violet-500/50">
                  Смотреть →
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {car.brand} {car.model}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {car.year} год
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-200 backdrop-blur-sm shadow-lg shadow-emerald-500/20">
                    {car.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-lg bg-slate-800/50 px-2 py-1 text-slate-300 border border-slate-700/50">
                    {car.body_type}
                  </span>
                  <span className="rounded-lg bg-slate-800/50 px-2 py-1 text-slate-300 border border-slate-700/50">
                    {car.transmission}
                  </span>
                  <span className="rounded-lg bg-slate-800/50 px-2 py-1 text-slate-300 border border-slate-700/50">
                    {car.fuel_type}
                  </span>
                  <span className="rounded-lg bg-slate-800/50 px-2 py-1 text-slate-300 border border-slate-700/50">
                    {car.mileage.toLocaleString('ru-RU')} км
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-400 leading-relaxed">
                  {car.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-slate-500">
            Чтобы сохранять объявления в избранное,{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              создайте аккаунт
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}


