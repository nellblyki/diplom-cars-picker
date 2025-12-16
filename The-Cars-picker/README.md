## The Cars Picker — MVP агрегатор объявлений

**Идея:** пользователь описывает «человеческим» текстом, какую машину хочет (например:  
«хочу комфортную, большую семейную машину с большим багажником и экономичную до 2 млн»).  
Backend парсит запрос, превращает в фильтры и подбирает подходящие объявления из каталога.

> Это учебный MVP: вместо настоящих API Авито/Дром/Авто.ру используется моковый JSON.  
> Цель — показать архитектуру, REST API и фронт на React + Tailwind + React Router.

---

### Функциональность

- Простая NLP‑обработки текста: `POST /api/nlp/parse`.
- Поиск по каталогу: `POST /api/cars/search`, `GET /api/cars`, `GET /api/cars/:id`.
- Пользовательская регистрация/логин: `POST /api/auth/register`, `POST /api/auth/login`.
- Избранные автомобили: `GET /api/favorites`, `POST /api/favorites` (toggle).
- Мини-CRUD «отзывы/публикации» (`/api/posts`) с правами автора.
- Страница «Локация» с адресом и встроенной картой Яндекс.
- Фронтенд:
  - Главная страница с текстовым запросом и карточками результатов.
  - Каталог и страница детали объявления.
  - Избранное (только для авторизованных).
  - Страницы регистрации и входа.
  - Локация с кнопкой в хедере («пл. Гагарина, 1»).

---

### Технологии

- **Frontend:** React 19, React Router v7, Tailwind CSS (через `@tailwindcss/vite`), контекст авторизации.
- **Backend:** Node.js + Express + CORS + SQLite (`better-sqlite3`), bcryptjs для хеширования паролей, мок‑данные `server/mock-cars.js`.
- **Инфраструктура:** SQLite-файл `server/data/cars-picker.db`, in-memory sessions/tokens, хранение избранного и постов в БД.
- **Dev tooling:** Vite, ESLint, concurrently (`npm run dev:full` поднимает фронт и бэкенд).

---

### Структура

```
The-Cars-picker/
├─ server/
│  ├─ index.js        # Express REST API
│  └─ mock-cars.js    # Список объявлений
├─ src/
│  ├─ App.jsx         # Маршруты + Layout
│  ├─ main.jsx        # Входная точка, BrowserRouter + AuthProvider
│  └─ modules/
│     ├─ auth/        # AuthContext, LoginPage, RegisterPage
│     ├─ home/        # HomePage с текстовым поиском
│     ├─ catalog/     # CatalogPage, CarDetailsPage
│     ├─ favorites/   # FavoritesPage (PrivateRoute)
│     └─ location/    # LocationPage с Яндекс-картой
├─ package.json
└─ README.md
```

---

### Запуск

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск backend (порт 4000)
npm run server

# 3. Отдельно фронтенд (порт ~5173)
npm run dev

# или всё вместе (backend + frontend в двух процессах)
npm run dev:full
```

> Убедись, что backend действительно работает: `http://localhost:4000/api/cars`
> должен вернуть JSON со списком машин.

---

### REST API (MVP)

| Method | Endpoint              | Описание                                       |
|--------|-----------------------|------------------------------------------------|
| POST   | `/api/nlp/parse`      | Разбор текстового запроса в фильтры            |
| POST   | `/api/cars/search`    | Поиск по каталогу с учётом фильтров            |
| GET    | `/api/cars`           | Полный каталог (мок‑данные)                    |
| GET    | `/api/cars/:id`       | Детали объявления                              |
| POST   | `/api/auth/register`  | Регистрация, bcrypt-хеш пароля, token+user     |
| POST   | `/api/auth/login`     | Вход, проверка пароля, token+user              |
| GET    | `/api/favorites`      | Список избранных (требует Authorization)       |
| POST   | `/api/favorites`      | Toggle избранного (требует Authorization)      |
| GET    | `/api/posts`          | Список всех постов/отзывов                     |
| GET    | `/api/posts/:id`      | Получить конкретный пост                       |
| POST   | `/api/posts`          | Создать пост (только авторизованные)           |
| PUT    | `/api/posts/:id`      | Обновить пост (только автор)                   |
| DELETE | `/api/posts/:id`      | Удалить пост (только автор)                    |

**Авторизация:** токен из login/register хранится в `localStorage` и передаётся в
`Authorization: Bearer <token>`.

---

### Схема базы данных (SQLite)

| Таблица     | Поля                                                                                          | Назначение                               |
|-------------|-----------------------------------------------------------------------------------------------|------------------------------------------|
| `users`     | `id`, `email` (UNIQUE), `password_hash` (bcrypt), `name`, `created_at`                        | Аккаунты пользователей                   |
| `favorites` | `id`, `user_id` (FK → users), `car_id`, `UNIQUE(user_id, car_id)`                             | Связка пользователь ↔ избранное авто     |
| `posts`     | `id`, `user_id` (FK → users), `title`, `content`, `created_at`, `updated_at`                  | Мини-CRUD «отзывы/публикации»            |

- Файл базы: `server/data/cars-picker.db` (создаётся автоматически).
- Все пароли хранятся в виде bcrypt-хеша (`bcryptjs`).
- Сессии/токены остаются в памяти процесса Node.js (упрощение для MVP).

---

### Пример: NLP → 검색 → результат

```http
POST /api/nlp/parse
{
  "query": "комфортный семейный внедорожник до 2 млн"
}
```

Ответ:

```json
{
  "filters": {
    "price_max": 2000000,
    "body_type": ["SUV", "crossover"],
    "tags": ["comfort", "family"]
  }
}
```

Затем фронт сразу делает:

```http
POST /api/cars/search
{
  "filters": {
    "price_max": 2000000,
    "body_type": ["SUV", "crossover"],
    "tags": ["comfort", "family"]
  }
}
```

И получает список подходящих объявлений.

---

### Ограничения MVP

- Каталог авто — статический JSON вместо реальных маркетплейсов.
- Сессии/токены хранятся в памяти процесса Node.js (перезапуск = выход из аккаунта).
- Нет панели администратора, CRUD реализован только для сущности «posts».

Несмотря на ограничения, проект демонстрирует UX поиска «простыми словами», REST API,
авторизацию с bcrypt, работу с избранным, мини-CRUD и Tailwind-интерфейс. При желании
можно подключить реальные источники данных и полноценное управление контентом,
оставив существующий фронт и контракты API.
