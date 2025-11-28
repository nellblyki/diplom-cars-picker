import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState(
    'я хочу комфортную, большую семейную машину с большим багажником и экономичную до 2 млн',
  );
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
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Подбор машины по обычному человеческому запросу
            </h1>
            <p className="text-sm text-slate-400">
              Опишите словами, какую машину вы хотите, а прототип переведёт это
              в фильтры поиска и подберёт варианты из каталога (мок‑данные вместо
              реальных API Авито/Дром/Авто.ру).
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 px-3 py-1">
                NLP → фильтры
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                REST API (Express)
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1">
                React + React Router + Tailwind
              </span>
            </div>
          </div>
          <div className="w-full max-w-md flex-1 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="text-xs font-medium text-slate-300">
                Опишите желаемую машину
              </label>
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-indigo-500/30 focus:border-indigo-500 focus:ring-2"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow shadow-indigo-500/40 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Подбираем варианты…' : 'Подобрать машины'}
              </button>
              <p className="text-[11px] text-slate-500">
                В реальном проекте здесь было бы обращение к API Авито/Дром/Авто.ру
                через единый агрегирующий сервис. В MVP используем небольшой JSON
                с объявлениями.
              </p>
            </form>
          </div>
        </div>
      </section>

      {filters && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          <div className="mb-2 font-semibold">Распознанные фильтры (MVP):</div>
          <div className="flex flex-wrap gap-3">
            {filters.price_max && (
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Цена до {filters.price_max.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {filters.body_type?.length > 0 && (
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Тип кузова: {filters.body_type.join(', ')}
              </span>
            )}
            {filters.tags?.length > 0 && (
              <span className="rounded-full border border-slate-700 px-3 py-1">
                Теги: {filters.tags.join(', ')}
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
            className="text-xs text-indigo-400 hover:text-indigo-300"
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((car) => (
            <Link
              key={car.id}
              to={`/cars/${car.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow shadow-black/40 hover:border-indigo-500/80"
            >
              <div className="relative h-40 w-full overflow-hidden">
                {car.image ? (
                  <img
                    src={car.image}
                    alt={car.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs text-slate-400">
                    Нет фото
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-slate-100">
                  {car.city}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-100">
                    {car.brand} {car.model}
                  </div>
                  <div className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-100">
                    {car.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span>
                    {car.year} г, {car.body_type}
                  </span>
                  <span>· {car.transmission}</span>
                  <span>· {car.fuel_type}</span>
                  <span>· {car.mileage.toLocaleString('ru-RU')} км</span>
                </div>
                <p className="line-clamp-2 text-[11px] text-slate-400">
                  {car.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-slate-500">
            Чтобы сохранять объявления в избранное,{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
              создайте аккаунт
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}


