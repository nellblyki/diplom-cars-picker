import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function CarDetailsPage() {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState('');
  const [favIds, setFavIds] = useState([]);

  const loadCar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/cars/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Авто не найдено');
      }
      const data = await res.json();
      setCar(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFavIds((data.items || []).map((c) => c.id));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCar();
  }, [id]);

  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !car) return;
    setFavLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ carId: car.id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setFavIds(data.favorites || []);
    } finally {
      setFavLoading(false);
    }
  };

  const isFavorite = car && favIds.includes(car.id);

  if (loading) {
    return <p className="text-sm text-slate-400">Загружаем объявление…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
          {car.image ? (
            <img
              src={car.image}
              alt={car.title}
              className="h-64 w-full object-cover md:h-80"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-slate-800 text-sm text-slate-400">
              Нет фото
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <h1 className="text-xl font-semibold">
            {car.brand} {car.model}, {car.year} г.
          </h1>
          <p className="text-slate-400">{car.description}</p>
        </div>
      </div>

      <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Цена
            </div>
            <div className="text-xl font-semibold text-slate-50">
              {car.price.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-100">
            {car.city}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div>
            <dt className="text-slate-500">Кузов</dt>
            <dd>{car.body_type}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Пробег</dt>
            <dd>{car.mileage.toLocaleString('ru-RU')} км</dd>
          </div>
          <div>
            <dt className="text-slate-500">Топливо</dt>
            <dd>{car.fuel_type}</dd>
          </div>
          <div>
            <dt className="text-slate-500">КПП</dt>
            <dd>{car.transmission}</dd>
          </div>
        </dl>

        {car.tags?.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Теги (для фильтрации):</div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {car.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-700 px-3 py-1 text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={favLoading}
            className={`flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-medium shadow ${
              isFavorite
                ? 'border border-amber-400/60 bg-amber-500/10 text-amber-200'
                : 'bg-indigo-500 text-white shadow-indigo-500/40 hover:bg-indigo-400'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {favLoading
              ? 'Обновляем избранное…'
              : isFavorite
              ? 'Убрать из избранного'
              : 'Добавить в избранное'}
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            Авторизуйтесь, чтобы добавить машину в избранное.
          </p>
        )}
      </aside>
    </div>
  );
}


