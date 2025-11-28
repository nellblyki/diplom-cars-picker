import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function FavoritesPage() {
  const { token } = useAuth();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
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
  }, [token]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Избранные автомобили</h1>
      <p className="text-sm text-slate-400">
        Список формируется на стороне backend в памяти для текущей сессии
        пользователя (MVP, без базы данных).
      </p>

      {loading && <p className="text-sm text-slate-400">Загружаем избранное…</p>}
      {error && (
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {cars.length === 0 && !loading && (
        <p className="text-sm text-slate-400">
          В избранном пока пусто. Откройте интересные объявления в каталоге и
          нажмите «Добавить в избранное».
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => (
          <Link
            key={car.id}
            to={`/cars/${car.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow shadow-black/40 hover:border-amber-400/80"
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
    </div>
  );
}


