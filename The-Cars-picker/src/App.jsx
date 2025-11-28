import { Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import { useAuth } from './modules/auth/AuthContext.jsx';
import { HomePage } from './modules/home/HomePage.jsx';
import { CatalogPage } from './modules/catalog/CatalogPage.jsx';
import { CarDetailsPage } from './modules/catalog/CarDetailsPage.jsx';
import { FavoritesPage } from './modules/favorites/FavoritesPage.jsx';
import { LoginPage } from './modules/auth/LoginPage.jsx';
import { RegisterPage } from './modules/auth/RegisterPage.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">
              The Cars Picker
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/catalog"
              className="text-slate-200 hover:text-white hover:underline"
            >
              Каталог
            </Link>
            <Link
              to="/favorites"
              className="text-slate-200 hover:text-white hover:underline"
            >
              Избранное
            </Link>
            {isAuthenticated ? (
              <>
                <span className="text-xs text-slate-400">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-100 hover:border-red-500 hover:text-red-200"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-200 hover:text-white hover:underline"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white shadow hover:bg-indigo-400"
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/cars/:id" element={<CarDetailsPage />} />
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <FavoritesPage />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
