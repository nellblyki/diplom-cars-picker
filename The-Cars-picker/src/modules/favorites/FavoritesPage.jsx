import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function FavoritesPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/favorites`, {
          headers: {
            'X-User-Id': user.id.toString(),
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Ошибка загрузки избранного');
        }
        const data = await res.json();
        setCars(data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
            ⭐ Избранные автомобили
          </span>
        </h1>
        <p className="text-base text-slate-300">
          Ваши сохранённые объявления всегда под рукой.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin text-5xl">⭐</div>
            <p className="text-lg text-slate-300 font-medium">Загружаем избранное…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm px-6 py-4 text-sm text-red-200 animate-fade-in-up shadow-lg shadow-red-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {cars.length === 0 && !loading && (
        <div className="text-center py-16 animate-fade-in-up">
          <div className="text-6xl mb-4 animate-bounce">⭐</div>
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Избранное пусто</h2>
          <p className="text-base text-slate-400 mb-6">
            Откройте интересные объявления в каталоге и нажмите «Добавить в избранное».
          </p>
          <Link
            to="/catalog"
            className="inline-block rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-violet-500/70 transition-all duration-300 hover:scale-105"
          >
            Перейти в каталог →
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-animation">
        {cars.map((car, index) => (
          <Link
            key={car.id}
            to={`/cars/${car.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-yellow-500/40 glass-effect shadow-xl shadow-yellow-500/30 card-hover animate-fade-in-up"
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
              <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-yellow-500/90 via-orange-500/90 to-pink-500/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold text-white shadow-lg shadow-yellow-500/50">
                ⭐
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition-colors">
                    {car.brand} {car.model}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {car.year} год
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-pink-500/30 border border-yellow-500/40 px-3 py-1.5 text-xs font-bold text-yellow-200 backdrop-blur-sm shadow-lg shadow-yellow-500/20">
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
    </div>
  );
}


