# The Cars Picker — Full‑Stack README (стек + архитектура)

Этот файл — **отдельная техническая документация** по проекту: полный стек, структура, запуск, БД, API и ключевые потоки во фронте/бэке.

---

### Что это за проект

**The Cars Picker** — учебный MVP, где пользователь пишет запрос «человеческим языком» (например: «премиальная быстрая машина до 3 млн»), а система:

- на **бэкенде** превращает текст в набор фильтров (наивный NLP-парсер),
- ищет подходящие авто в каталоге (SQLite),
- на **фронтенде** показывает результаты, детали объявления, избранное и отзывы.

---

### Полный стек технологий

#### Frontend

- **React 19** (`react`, `react-dom`)
- **React Router v7** (`react-router-dom`) — маршрутизация, `PrivateRoute`
- **Vite** — dev server + сборка
- **Tailwind CSS (подключение через CSS import)** — `src/index.css` содержит `@import "tailwindcss";`
- **Custom CSS** — анимации/эффекты (`src/App.css`: `glass-effect`, `shimmer`, `card-hover`, keyframes)
- **Auth (клиентский)** — Context + LocalStorage (`src/modules/auth/AuthContext.jsx`)
- **HTTP** — `fetch` (без отдельного клиента), базовый URL захардкожен как `http://localhost:4000`

#### Backend

- **Node.js (ESM)** — `"type": "module"` в `package.json`
- **Express** — REST API
- **cors** — CORS для запросов фронта
- **sql.js** — SQLite (WASM) в Node.js
  - База живёт в памяти процесса, но **сохраняется в файл** через `db.export()` → `server/data/cars-picker.sqlite`
- **bcryptjs** — хеширование паролей (`users.password_hash`)

#### Хранилище данных

- **SQLite файл**: `The-Cars-picker/server/data/cars-picker.sqlite`
- Первичное наполнение таблицы `cars` — из `server/mock-cars.js` (если таблица пустая)

#### Dev tooling

- **ESLint (flat config)** — `eslint.config.js`
- **concurrently** — параллельный запуск фронта+бэка (`npm run dev:full`)

---

### Структура проекта (важные файлы)

```
The-Cars-picker/
  server/
    index.js               # Express API + SQLite (sql.js) + схемы таблиц + сидинг авто
    mock-cars.js           # моковый каталог авто (seed)
    data/cars-picker.sqlite# файл БД (создаётся/обновляется автоматически)

  src/
    main.jsx               # BrowserRouter + AuthProvider + App
    App.jsx                # маршруты + header + PrivateRoute
    index.css              # Tailwind import
    App.css                # анимации/эффекты, glass/shimmer/hover
    modules/
      auth/
        AuthContext.jsx    # LocalStorage auth, user/id
        LoginPage.jsx      # POST /api/auth/login
        RegisterPage.jsx   # POST /api/auth/register
      home/
        HomePage.jsx       # NLP: POST /api/nlp/parse → POST /api/cars/search
      catalog/
        CatalogPage.jsx    # GET /api/cars
        CarDetailsPage.jsx # GET /api/cars/:id + отзывы + избранное
      favorites/
        FavoritesPage.jsx  # GET /api/favorites (только авторизованные)
      location/
        LocationPage.jsx   # iframe Яндекс-карты
```

---

### Как запустить (frontend + backend)

#### Требования

- **Node.js** (рекомендуется актуальный LTS)

#### Установка и запуск

Из папки `The-Cars-picker/`:

```bash
npm install

# бэкенд: http://localhost:4000
npm run server

# фронт: http://localhost:5173 (обычно)
npm run dev

# или оба процесса вместе
npm run dev:full
```

#### Порты

- **Backend**: `PORT` из окружения или `4000`
- **Frontend**: порт Vite (обычно `5173`)

---

### Авторизация и безопасность (как это реально устроено в коде)

#### Как хранится сессия на фронте

- После `register/login` сервер возвращает **`user`** `{ id, email, name }`
- Фронт кладёт пользователя в LocalStorage ключом `cars_picker_auth`
- Флаг «вошёл/не вошёл» = `Boolean(user)`

#### Как защищены эндпоинты на бэкенде

Вместо JWT/сессий в cookies используется простой заголовок:

- **`X-User-Id: <число>`**

Бэкенд проверяет:

- заголовок есть,
- это число,
- пользователь с таким `id` существует в `users`.

> Важно: это **MVP‑механика**. Для продакшна обычно используют JWT/сессии, нормальные токены, CSRF, rate limiting и т.д.

---

### База данных: таблицы и назначение

Бэкенд создаёт таблицы при старте (если их нет):

- **`users`**
  - `id`, `email` (unique), `password_hash` (bcrypt), `name`, `created_at`
- **`cars`**
  - карточки авто (данные из `mock-cars.js` сохраняются в SQLite при первом запуске)
  - `tags` хранится строкой JSON
- **`favorites`**
  - связка many-to-many: `user_id` ↔ `car_id`, уникальность пары `(user_id, car_id)`
- **`reviews`**
  - отзывы к авто: `car_id`, `user_id`, `rating` 1..5, `comment`, `created_at`
- **`posts`**
  - демонстрационный CRUD (посты/статьи): автор, заголовок, контент, timestamps
- **`sessions`**
  - таблица под токены/сессии (в текущей реализации почти не используется)

---

### REST API (контракт)

Базовый URL (локально): `http://localhost:4000`

#### NLP / поиск

- **POST** `/api/nlp/parse`
  - body: `{ "query": "..." }`
  - ответ: `{ "filters": { price_min, price_max, body_type:[], tags:[], brands:[], title:[] } }`

- **POST** `/api/cars/search`
  - body: `{ "filters": { ... } }`
  - ответ: `{ "items": [...] }` (список машин)

#### Каталог

- **GET** `/api/cars`
  - ответ: `{ "items": [...] }`

- **GET** `/api/cars/:id`
  - ответ: объект машины

#### Auth

- **POST** `/api/auth/register`
  - body: `{ "email": "...", "password": "...", "name": "..." }`
  - ответ: `{ "user": { id, email, name } }`

- **POST** `/api/auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - ответ: `{ "user": { id, email, name } }`

- **POST** `/api/auth/logout`
  - ответ: `{ "success": true }` (фактически logout происходит на клиенте)

#### Избранное (требует `X-User-Id`)

- **GET** `/api/favorites`
  - headers: `X-User-Id: <userId>`
  - ответ: `{ "items": [...] }` (машины, которые в избранном)

- **POST** `/api/favorites` (toggle)
  - headers: `X-User-Id: <userId>`
  - body: `{ "carId": <number> }`
  - ответ: `{ "success": true, "favorites": [carId, ...] }`

#### Отзывы (reviews)

- **GET** `/api/cars/:id/reviews`
  - ответ: `{ "items": [...] }` (включая `user_name`, `user_email`)

- **POST** `/api/cars/:id/reviews` (требует `X-User-Id`)
  - headers: `X-User-Id: <userId>`
  - body: `{ "rating": 1..5, "comment": "..." }`

#### Posts CRUD (пример сущности, требует `X-User-Id` на изменение)

- **GET** `/api/posts` → `{ items: [...] }`
- **GET** `/api/posts/:id` → post
- **POST** `/api/posts` (auth) → создать
- **PUT** `/api/posts/:id` (auth, только автор) → обновить
- **DELETE** `/api/posts/:id` (auth, только автор) → удалить

#### Debug

- **GET** `/api/debug/cars-count`
- **GET** `/api/debug/cars-list`

---

### Ключевые сценарии (как это склеено end-to-end)

#### 1) «Человеческий запрос» → фильтры → подбор авто

- `HomePage.jsx`:
  - `POST /api/nlp/parse` → получает `filters`
  - затем `POST /api/cars/search` → получает `items`

#### 2) Избранное

- Фронт хранит `user.id` в LocalStorage (через `AuthContext`)
- Для запросов к избранному добавляет заголовок `X-User-Id`
- Бэкенд хранит избранное в таблице `favorites`

#### 3) Отзывы

- Детальная страница делает:
  - `GET /api/cars/:id/reviews` (показ)
  - `POST /api/cars/:id/reviews` с `X-User-Id` (создание)

---

### Важные замечания / ограничения MVP

- **API_BASE захардкожен** в нескольких компонентах как `http://localhost:4000`. Для деплоя обычно выносят в env (`import.meta.env`) и прокси Vite.
- **Auth без токенов**: используется `X-User-Id` (упрощение для учебного проекта).
- **Tailwind** подключён через `@import "tailwindcss"`, а в Vite конфиге указан плагин — при переносе проекта убедись, что соответствующие пакеты Tailwind действительно установлены.
- Каталог авто в основе моковый (`server/mock-cars.js`), но после первого запуска сохраняется в SQLite.

---

### Команды npm

- `npm run dev` — Vite dev server (frontend)
- `npm run server` — Express API (backend)
- `npm run dev:full` — оба процесса параллельно
- `npm run build` / `npm run preview` — сборка/превью фронта
- `npm run lint` — ESLint


