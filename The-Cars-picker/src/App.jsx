import { Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import { useAuth } from './modules/auth/AuthContext.jsx';
import { HomePage } from './modules/home/HomePage.jsx';
import { CatalogPage } from './modules/catalog/CatalogPage.jsx';
import { CarDetailsPage } from './modules/catalog/CarDetailsPage.jsx';
import { FavoritesPage } from './modules/favorites/FavoritesPage.jsx';
import { LoginPage } from './modules/auth/LoginPage.jsx';
import { RegisterPage } from './modules/auth/RegisterPage.jsx';
import { LocationPage } from './modules/location/LocationPage.jsx';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <header className="relative border-b border-slate-800/50 glass-effect animate-fade-in">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 group transition-transform hover:scale-105"
          >
            <div className="relative">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                The Cars Picker
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Ростов-на-Дону · пл. Гагарина, 1
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/catalog"
              className="relative px-3 py-1.5 text-slate-200 hover:text-white transition-all duration-300 rounded-lg hover:bg-slate-800/50 group"
            >
              Каталог
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-violet-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/favorites"
              className="relative px-3 py-1.5 text-slate-200 hover:text-white transition-all duration-300 rounded-lg hover:bg-slate-800/50 group"
            >
              Избранное
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-violet-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/location"
              className="rounded-full border border-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-all duration-300 hover:border-cyan-500/50 hover:text-cyan-200 hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30"
            >
              пл. Гагарина, 1
            </Link>
            {isAuthenticated ? (
              <>
                <span className="text-xs text-slate-400 px-2">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-100 transition-all duration-300 hover:border-red-500/50 hover:text-red-200 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-slate-200 hover:text-white transition-all duration-300 rounded-lg hover:bg-slate-800/50"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="relative rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-violet-500/70 transition-all duration-300 hover:scale-105 hover:from-blue-400 hover:via-violet-400 hover:to-fuchsia-400"
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8">
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
          <Route path="/location" element={<LocationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
