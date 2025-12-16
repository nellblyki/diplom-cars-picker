import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const API_BASE = 'http://localhost:4000';

export function CarDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [error, setError] = useState('');
  const [favIds, setFavIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);

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
    if (!isAuthenticated || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFavIds((data.items || []).map((c) => c.id));
    } catch {
      // ignore
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cars/${id}/reviews`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.items || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCar();
    loadReviews();
  }, [id]);

  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated, user]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !car || !user) return;
    setFavLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !reviewText.trim()) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cars/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Ошибка отправки отзыва');
      }
      setReviewText('');
      setReviewRating(5);
      loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const isFavorite = car && favIds.includes(car.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin text-4xl">🚗</div>
          <p className="text-lg text-slate-300 font-medium">Загружаем объявление…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm px-6 py-4 text-sm text-red-200 animate-fade-in-up shadow-lg shadow-red-500/20">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] animate-fade-in">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/50 glass-effect shadow-2xl animate-scale-in group">
          {car.image ? (
            <>
              <img
                src={car.image}
                alt={car.title}
                className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </>
          ) : (
            <div className="flex h-80 w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-sm text-slate-400">
              Нет фото
            </div>
          )}
        </div>
        <div className="space-y-3 animate-fade-in-up animate-delay-200">
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              {car.brand} {car.model}
            </span>
            <span className="text-slate-300">, {car.year} г.</span>
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">{car.description}</p>
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-800/50 glass-effect p-6 shadow-xl animate-fade-in-up animate-delay-300">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-cyan-400">💬</span>
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Отзывы
            </span>
          </h2>
          
          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="space-y-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-blue-500/15 via-violet-500/15 to-fuchsia-500/15 backdrop-blur-sm p-5 animate-scale-in">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span className="text-amber-400">⭐</span>
                  Оценка
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 outline-none ring-2 ring-transparent focus:border-cyan-500/50 focus:ring-cyan-500/30 focus:bg-slate-900/70 transition-all duration-300"
                >
                  <option value={5}>5 - Отлично ⭐⭐⭐⭐⭐</option>
                  <option value={4}>4 - Хорошо ⭐⭐⭐⭐</option>
                  <option value={3}>3 - Нормально ⭐⭐⭐</option>
                  <option value={2}>2 - Плохо ⭐⭐</option>
                  <option value={1}>1 - Очень плохо ⭐</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span className="text-cyan-400">✍️</span>
                  Ваш отзыв
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Напишите ваш отзыв о машине..."
                  className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 outline-none ring-2 ring-transparent focus:border-indigo-500/50 focus:ring-indigo-500/30 focus:bg-slate-900/70 transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={reviewLoading || !reviewText.trim()}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-violet-500/70 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] hover:from-blue-400 hover:via-violet-400 hover:to-fuchsia-400"
              >
                {reviewLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Отправляем...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    💬 Оставить отзыв
                  </span>
                )}
                {!reviewLoading && <span className="absolute inset-0 shimmer"></span>}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-4 text-center">
              <p className="text-sm text-amber-200">
                🔐 Авторизуйтесь, чтобы оставить отзыв.
              </p>
            </div>
          )}

          <div className="space-y-4 stagger-animation">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-slate-400">📝 Пока нет отзывов</p>
                <p className="text-sm text-slate-500 mt-2">Будьте первым, кто оставит отзыв!</p>
              </div>
            ) : (
              reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-700/50 glass-effect p-4 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-500/30">
                        {(review.user_name || review.user_email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {review.user_name || review.user_email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-lg">
                      <span className="text-amber-400">
                        {'★'.repeat(review.rating)}
                      </span>
                      <span className="text-slate-600">
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">{review.comment}</p>
                  <p className="text-xs text-slate-500">
                    📅 {new Date(review.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-6 rounded-3xl border border-slate-800/50 glass-effect p-6 shadow-xl animate-fade-in-up animate-delay-400">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/25 to-blue-500/25 border border-emerald-500/40 p-6 shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                💰 Цена
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {car.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 px-4 py-2 text-xs font-semibold text-slate-100">
              📍 {car.city}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/20">
            <dt className="text-xs text-slate-400 mb-1">🚗 Кузов</dt>
            <dd className="text-sm font-semibold text-slate-200">{car.body_type}</dd>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/20">
            <dt className="text-xs text-slate-400 mb-1">📊 Пробег</dt>
            <dd className="text-sm font-semibold text-slate-200">{car.mileage.toLocaleString('ru-RU')} км</dd>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/20">
            <dt className="text-xs text-slate-400 mb-1">⛽ Топливо</dt>
            <dd className="text-sm font-semibold text-slate-200">{car.fuel_type}</dd>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/50 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/20">
            <dt className="text-xs text-slate-400 mb-1">⚙️ КПП</dt>
            <dd className="text-sm font-semibold text-slate-200">{car.transmission}</dd>
          </div>
        </div>

        {car.tags?.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">🏷️ Теги</div>
            <div className="flex flex-wrap gap-2">
              {car.tags.map((tag, index) => (
                <span
                  key={tag}
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-medium text-cyan-200 backdrop-blur-sm hover:scale-110 transition-transform duration-300 animate-fade-in-up shadow-lg shadow-cyan-500/20"
                  style={{ animationDelay: `${index * 0.1}s` }}
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
            className={`relative w-full overflow-hidden flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
              isFavorite
                ? 'border-2 border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 shadow-amber-500/50 hover:shadow-amber-500/70'
                : 'bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 text-white shadow-blue-500/50 hover:shadow-violet-500/70 hover:from-blue-400 hover:via-violet-400 hover:to-fuchsia-400'
            }`}
          >
            {favLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span>
                Обновляем избранное…
              </span>
            ) : isFavorite ? (
              <span className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                Убрать из избранного
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                Добавить в избранное
              </span>
            )}
            {!favLoading && <span className="absolute inset-0 shimmer"></span>}
          </button>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-4 text-center">
            <p className="text-sm text-amber-200">
              🔐 Авторизуйтесь, чтобы добавить машину в избранное.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}


