import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';

import cars from './mock-cars.js';

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const SQL = await initSqlJs({
  locateFile: (file) => path.join(process.cwd(), 'node_modules/sql.js/dist', file),
});

const dbFilePath = path.join(dataDir, 'cars-picker.sqlite');
let db;
if (fs.existsSync(dbFilePath)) {
  const fileBuffer = fs.readFileSync(dbFilePath);
  db = new SQL.Database(new Uint8Array(fileBuffer));
} else {
  db = new SQL.Database();
}

function persistDb() {
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    UNIQUE(user_id, car_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price INTEGER NOT NULL,
    body_type TEXT NOT NULL,
    mileage INTEGER NOT NULL,
    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    city TEXT NOT NULL,
    image TEXT,
    description TEXT,
    tags TEXT
  );
`);

persistDb();

// Инициализация машин в БД (загружаем из mock-cars.js, если таблица пустая)
function initCars() {
  const existingCount = selectOne('SELECT COUNT(*) AS count FROM cars');
  if (existingCount && existingCount.count > 0) {
    return; // Машины уже загружены
  }
  
  console.log('Загружаем машины в БД...');
  for (const car of cars) {
    const tagsStr = Array.isArray(car.tags) ? JSON.stringify(car.tags) : null;
    runMutation(
      `INSERT OR IGNORE INTO cars 
       (id, title, brand, model, year, price, body_type, mileage, fuel_type, transmission, city, image, description, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        car.id,
        car.title,
        car.brand,
        car.model,
        car.year,
        car.price,
        car.body_type,
        car.mileage,
        car.fuel_type,
        car.transmission,
        car.city,
        car.image || null,
        car.description || null,
        tagsStr,
      ],
    );
  }
  console.log(`Загружено ${cars.length} машин в БД`);
}

initCars();

app.use(cors());
app.use(express.json());

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  // Для LocalStorage аутентификации проверяем userId из заголовка
  const userIdHeader = req.headers['x-user-id'];
  if (!userIdHeader) {
    return res.status(401).json({ message: 'No user ID provided' });
  }
  const userId = Number(userIdHeader);
  if (!userId || isNaN(userId)) {
    return res.status(401).json({ message: 'Invalid user ID' });
  }
  // Проверяем, что пользователь существует
  const userRow = selectOne('SELECT id FROM users WHERE id = ?', [userId]);
  if (!userRow) {
    return res.status(401).json({ message: 'User not found' });
  }
  req.userId = userId;
  next();
}

// Helper to sanitize params - convert undefined to null and ensure proper types
function sanitizeParams(params) {
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'number' && isNaN(p)) return null;
    return p;
  });
}

function selectOne(query, params = []) {
  const stmt = db.prepare(query);
  const sanitized = sanitizeParams(params);
  stmt.bind(sanitized);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function selectAll(query, params = []) {
  const stmt = db.prepare(query);
  const sanitized = sanitizeParams(params);
  stmt.bind(sanitized);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function runMutation(query, params = []) {
  const stmt = db.prepare(query);
  const sanitized = sanitizeParams(params);
  stmt.bind(sanitized);
  stmt.step();
  stmt.free();
  persistDb();
}

function insertAndGetId(query, params = []) {
  const stmt = db.prepare(query);
  const sanitized = sanitizeParams(params);
  stmt.bind(sanitized);
  stmt.step();
  stmt.free();
  const idStmt = db.prepare('SELECT last_insert_rowid() AS id;');
  idStmt.step();
  const id = Number(idStmt.getAsObject().id);
  idStmt.free();
  persistDb();
  return id;
}

function persistSession(token, userId) {
  runMutation(
    'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
    [token, userId],
  );
}

function deleteSession(token) {
  runMutation('DELETE FROM sessions WHERE token = ?', [token]);
}

const POSTS_BASE_QUERY = `
  SELECT p.*, u.name AS author_name, u.email AS author_email, u.id AS author_id
  FROM posts p
  JOIN users u ON u.id = p.user_id
`;

function mapPostRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      email: row.author_email,
    },
  };
}

// Simple NLP parser: very naive keyword-based
app.post('/api/nlp/parse', (req, res) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'query is required' });
  }

  const text = query.toLowerCase();
  const filters = {
    price_min: null,
    price_max: null,
    body_type: [],
    tags: [],
    brands: [],
    title: [],
  };

  // Price detection like "до 2 млн" or "до 2000000" or "от 1 млн"
  const priceMaxMatch = text.match(/до\s+(\d+)\s*([мm]лн)?/);
  if (priceMaxMatch) {
    let value = Number(priceMaxMatch[1]);
    const hasMillion = Boolean(priceMaxMatch[2]);
    if (hasMillion) {
      value = value * 1_000_000;
    }
    filters.price_max = value;
  }

  const priceMinMatch = text.match(/от\s+(\d+)\s*([мm]лн)?/);
  if (priceMinMatch) {
    let value = Number(priceMinMatch[1]);
    const hasMillion = Boolean(priceMinMatch[2]);
    if (hasMillion) {
      value = value * 1_000_000;
    }
    filters.price_min = value;
  }

  // Дорогая машина - устанавливаем минимальную цену
  if (text.includes('дорог') || text.includes('дорогую') || text.includes('дорого') || 
      text.includes('премиум') || text.includes('премиальн') || text.includes('люкс')) {
    if (!filters.price_min) {
      filters.price_min = 3000000; // От 3 млн
    }
    filters.tags.push('premium', 'luxury');
  }

  // Body types
  if (text.includes('внедорожник') || text.includes('джип') || text.includes('кроссовер')) {
    filters.body_type.push('SUV', 'crossover');
  }
  if (text.includes('седан')) {
    filters.body_type.push('sedan');
  }
  if (text.includes('хэтчбек') || text.includes('хетчбек')) {
    filters.body_type.push('hatchback');
  }
  if (text.includes('пикап') || text.includes('пикап')) {
    filters.body_type.push('pickup');
  }
  if (text.includes('минивэн') || text.includes('минивен') || text.includes('фургон')) {
    filters.body_type.push('minivan');
  }
  if (text.includes('купе') || text.includes('coupe')) {
    filters.body_type.push('coupe');
  }

  // Огромная/большая машина
  if (text.includes('огромн') || text.includes('больш') || text.includes('большую') ||
      text.includes('просторн') || text.includes('вместител')) {
    filters.body_type.push('SUV', 'minivan');
    filters.tags.push('big_trunk');
  }

  // Быстрая/динамичная/спортивная машина
  if (text.includes('быстр') || text.includes('быструю') || text.includes('динамичн') ||
      text.includes('спортивн') || text.includes('мощн') || text.includes('разгон') ||
      text.includes('крут') || text.includes('крутую')) {
    filters.tags.push('sport', 'premium');
    filters.brands.push('BMW', 'Mercedes-Benz', 'Audi', 'Porsche');
  }

  // Крутая машина (стильная + быстрая)
  if (text.includes('крут') || text.includes('крутую') || text.includes('стильн') ||
      text.includes('красив') || text.includes('элегантн')) {
    filters.tags.push('style', 'premium');
    filters.brands.push('BMW', 'Mercedes-Benz', 'Audi', 'Mazda', 'Lexus');
  }

  // Для внедорожья/бездорожья
  if (text.includes('внедорож') || text.includes('бездорож') || text.includes('проходимост') ||
      text.includes('для леса') || text.includes('для дачи') || text.includes('для охоты') ||
      text.includes('полный привод') || text.includes('4wd')) {
    filters.tags.push('offroad');
    filters.body_type.push('SUV', 'pickup');
    filters.brands.push('Toyota', 'Land Rover', 'Jeep', 'Subaru', 'UAZ', 'Lada');
  }

  if (text.includes('везде проедет') || text.includes('везде проедет')){
    filters.title.push('Toyota Hilux Surf');
  }

  // Премиальные бренды
  if (text.includes('премиум') || text.includes('премиальн') || text.includes('люкс') ||
      text.includes('bmw') || text.includes('мерседес') || text.includes('mercedes') ||
      text.includes('ауди') || text.includes('audi') || text.includes('лексус') ||
      text.includes('lexus') || text.includes('порше') || text.includes('porsche')) {
    filters.tags.push('premium');
    if (text.includes('bmw')) filters.brands.push('BMW');
    if (text.includes('мерседес') || text.includes('mercedes')) filters.brands.push('Mercedes-Benz');
    if (text.includes('ауди') || text.includes('audi')) filters.brands.push('Audi');
    if (text.includes('лексус') || text.includes('lexus')) filters.brands.push('Lexus');
    if (text.includes('порше') || text.includes('porsche')) filters.brands.push('Porsche');
  }

  // Надежные бренды
  if (text.includes('надежн') || text.includes('надежную') || text.includes('качественн')) {
    filters.brands.push('Toyota', 'Honda', 'Subaru', 'Mazda');
    filters.tags.push('reliable');
  }

  // Японские бренды
  if (text.includes('японск') || text.includes('японскую')) {
    filters.brands.push('Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Lexus');
  }

  // Немецкие бренды
  if (text.includes('немецк') || text.includes('немецкую')) {
    filters.brands.push('BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Skoda', 'Porsche');
  }

  // Конкретные бренды
  if (text.includes('тойота') || text.includes('toyota')) filters.brands.push('Toyota');
  if (text.includes('kia')) filters.brands.push('Kia');
  if (text.includes('хёндай') || text.includes('hyundai')) filters.brands.push('Hyundai');
  if (text.includes('шкода') || text.includes('skoda')) filters.brands.push('Skoda');
  if (text.includes('фольксваген') || text.includes('volkswagen') || text.includes('vw')) filters.brands.push('Volkswagen');
  if (text.includes('форд') || text.includes('ford')) filters.brands.push('Ford');
  if (text.includes('рено') || text.includes('renault')) filters.brands.push('Renault');
  if (text.includes('лада') || text.includes('lada')) filters.brands.push('Lada');
  if (text.includes('ниссан') || text.includes('nissan')) filters.brands.push('Nissan');
  if (text.includes('мазда') || text.includes('mazda')) filters.brands.push('Mazda');
  if (text.includes('хонда') || text.includes('honda')) filters.brands.push('Honda');
  if (text.includes('субару') || text.includes('subaru')) filters.brands.push('Subaru');
  if (text.includes('джип') || text.includes('jeep')) filters.brands.push('Jeep');
  if (text.includes('ленд ровер') || text.includes('land rover')) filters.brands.push('Land Rover');

  // Tags
  if (text.includes('комфорт') || text.includes('комфортную') || text.includes('комфортабел')) {
    filters.tags.push('comfort');
  }
  if (text.includes('семейн') || text.includes('семейную') || text.includes('для семьи')) {
    filters.tags.push('family');
  }
  if (text.includes('экономич') || text.includes('экономную') || text.includes('дешев') ||
      text.includes('недорог') || text.includes('бюджетн')) {
    filters.tags.push('economy');
  }
  if (text.includes('большой багажник') || text.includes('большим багажником') ||
      text.includes('просторн') || text.includes('просторную')) {
    filters.tags.push('big_trunk');
  }
  if (text.includes('городск') || text.includes('для города') || text.includes('в городе') ||
      text.includes('компактн') || text.includes('компактную')) {
    filters.tags.push('city');
  }

  // Спортивные/гоночные
  if (text.includes('гоночн') || text.includes('racing') || text.includes('трек') ||
      text.includes('для гонок')) {
    filters.tags.push('sport', 'racing');
    filters.brands.push('Porsche', 'BMW', 'Mercedes-Benz', 'Audi');
  }

  // Роскошные
  if (text.includes('роскошн') || text.includes('luxury') || text.includes('люкс')) {
    filters.tags.push('luxury', 'premium');
    if (!filters.price_min) {
      filters.price_min = 5000000; // От 5 млн для роскошных
    }
  }

  // Бизнес-класс
  if (text.includes('бизнес') || text.includes('для бизнеса') || text.includes('делов')) {
    filters.tags.push('business', 'premium');
    filters.brands.push('Mercedes-Benz', 'BMW', 'Audi', 'Lexus');
  }

  // Удаляем дубликаты из массивов
  filters.body_type = [...new Set(filters.body_type)];
  filters.tags = [...new Set(filters.tags)];
  filters.brands = [...new Set(filters.brands)];
  filters.title = [...new Set(filters.title)];

  res.json({ filters });
});

// Car search (from DB)
app.post('/api/cars/search', (req, res) => {
  const { filters = {} } = req.body ?? {};
  let query = 'SELECT * FROM cars WHERE 1=1';
  const params = [];

  if (filters.price_max != null) {
    query += ' AND price <= ?';
    params.push(filters.price_max);
  }
  if (filters.price_min != null) {
    query += ' AND price >= ?';
    params.push(filters.price_min);
  }
  if (Array.isArray(filters.body_type) && filters.body_type.length > 0) {
    const placeholders = filters.body_type.map(() => '?').join(',');
    query += ` AND LOWER(body_type) IN (${placeholders})`;
    params.push(...filters.body_type.map((x) => x.toLowerCase()));
  }
  
  // Фильтр по брендам
  if (Array.isArray(filters.brands) && filters.brands.length > 0) {
    const placeholders = filters.brands.map(() => '?').join(',');
    query += ` AND brand IN (${placeholders})`;
    params.push(...filters.brands);
  }

  // Фильтр по названию (частичное совпадение)
  if (Array.isArray(filters.title) && filters.title.length > 0) {
    const titleConditions = filters.title.map(() => 'LOWER(title) LIKE ?').join(' OR ');
    query += ` AND (${titleConditions})`;
    params.push(...filters.title.map((t) => `%${t.toLowerCase()}%`));
  }

  query += ' ORDER BY id';
  const rows = selectAll(query, params);
  let result = rows.map(mapCarRow);

  // Фильтр по тегам (после загрузки, т.к. tags хранится как JSON)
  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    const set = new Set(filters.tags.map((x) => x.toLowerCase()));
    result = result.filter((c) =>
      (c.tags ?? []).some((t) => set.has(String(t).toLowerCase())),
    );
  }

  res.json({ items: result });
});

// Helper function to map DB row to car object
function mapCarRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    price: row.price,
    body_type: row.body_type,
    mileage: row.mileage,
    fuel_type: row.fuel_type,
    transmission: row.transmission,
    city: row.city,
    image: row.image,
    description: row.description,
    tags: row.tags ? JSON.parse(row.tags) : [],
  };app.post('/api/favorites', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { carId } = req.body ?? {};
  if (!carId) {
    return res.status(400).json({ message: 'carId is required' });
  }
  const carRow = selectOne('SELECT id FROM cars WHERE id = ?', [carId]);
  if (!carRow) {
    return res.status(404).json({ message: 'Car not found' });
  }
  const existing = selectOne(
    'SELECT id FROM favorites WHERE user_id = ? AND car_id = ?',
    [userId, carId], // ✅ Исправлено: было cars.id → теперь carId
  );
  if (existing) {
    runMutation('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', [
      userId,
      carId,
    ]);
  } else {
    insertAndGetId('INSERT INTO favorites (user_id, car_id) VALUES (?, ?)', [
      userId,
      carId,
    ]);
  }
  const updated = selectAll('SELECT car_id FROM favorites WHERE user_id = ?', [
    userId,
  ]).map((row) => Number(row.car_id));
  res.json({ success: true, favorites: updated });
});

}

// Cars list (from DB)
app.get('/api/cars', (req, res) => {
  const rows = selectAll('SELECT * FROM cars ORDER BY id');
  const carsList = rows.map(mapCarRow);
  res.json({ items: carsList });
});

// Car details (from DB)
app.get('/api/cars/:id', (req, res) => {
  const { id } = req.params;
  const row = selectOne('SELECT * FROM cars WHERE id = ?', [id]);
  if (!row) {
    return res.status(404).json({ message: 'Car not found' });
  }
  res.json(mapCarRow(row));
});

// Auth with hashed passwords + SQLite
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email and password are required' });
    }
    const existing = selectOne('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = insertAndGetId(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name || 'User'],
    );
    const user = { id: userId, email, name: name || 'User' };
    // Для LocalStorage аутентификации возвращаем только user, без token
    res.status(201).json({ user });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ message: 'Internal error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email and password are required' });
    }
    const userRow = selectOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!userRow) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Для LocalStorage аутентификации возвращаем только user, без token
    res.json({
      user: { id: userRow.id, email: userRow.email, name: userRow.name },
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Internal error' });
  }
});

// Reviews API
app.get('/api/cars/:id/reviews', (req, res) => {
  const { id } = req.params;
  const reviews = selectAll(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.car_id = ?
     ORDER BY r.created_at DESC`,
    [id],
  );
  res.json({ items: reviews });
});

app.post('/api/cars/:id/reviews', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { rating, comment } = req.body ?? {};
  if (!rating || !comment) {
    return res.status(400).json({ message: 'rating and comment are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating must be between 1 and 5' });
  }
  const carRow = selectOne('SELECT id FROM cars WHERE id = ?', [id]);
  if (!carRow) {
    return res.status(404).json({ message: 'Car not found' });
  }
  const reviewId = insertAndGetId(
    'INSERT INTO reviews (car_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [id, userId, rating, comment],
  );
  const review = selectOne(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [reviewId],
  );
  res.status(201).json(review);
});

// Favorites persisted in SQLite
app.get('/api/favorites', authMiddleware, (req, res) => {
  const userId = req.userId;
  const rows = selectAll('SELECT car_id FROM favorites WHERE user_id = ?', [
    userId,
  ]);
  if (rows.length === 0) {
    return res.json({ items: [] });
  }
  const carIds = rows.map((row) => Number(row.car_id));
  const placeholders = carIds.map(() => '?').join(',');
  const carRows = selectAll(
    `SELECT * FROM cars WHERE id IN (${placeholders})`,
    carIds,
  );
  const favCars = carRows.map(mapCarRow);
  res.json({ items: favCars });
});

app.post('/api/favorites', authMiddleware, (req, res) => {
  const userId = Number(req.userId);
  const { carId } = req.body ?? {};
  
  if (!carId) {
    return res.status(400).json({ message: 'carId is required' });
  }
  
  const carIdNum = Number(carId);
  if (!carIdNum || isNaN(carIdNum)) {
    return res.status(400).json({ message: 'Invalid carId' });
  }
  
  if (!userId || isNaN(userId)) {
    return res.status(401).json({ message: 'Invalid user ID' });
  }
  
  const carRow = selectOne('SELECT id FROM cars WHERE id = ?', [carIdNum]);
  if (!carRow) {
    return res.status(404).json({ message: 'Car not found' });
  }
  
  const existing = selectOne(
    'SELECT id FROM favorites WHERE user_id = ? AND car_id = ?',
    [userId, carIdNum],
  );
  
  if (existing) {
    runMutation('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', [
      userId,
      carIdNum,
    ]);
  } else {
    insertAndGetId('INSERT INTO favorites (user_id, car_id) VALUES (?, ?)', [
      userId,
      carIdNum,
    ]);
  }
  
  const updated = selectAll('SELECT car_id FROM favorites WHERE user_id = ?', [
    userId,
  ]).map((row) => Number(row.car_id));
  
  res.json({ success: true, favorites: updated });
});

// Posts CRUD (example entity)
app.get('/api/posts', (req, res) => {
  const posts = selectAll(
    `${POSTS_BASE_QUERY} ORDER BY p.created_at DESC`,
  ).map(mapPostRow);
  res.json({ items: posts });
});

app.get('/api/posts/:id', (req, res) => {
  const post = mapPostRow(
    selectOne(`${POSTS_BASE_QUERY} WHERE p.id = ?`, [req.params.id]),
  );
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/posts', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { title, content } = req.body ?? {};
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }
  const postId = insertAndGetId(
    'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
    [userId, title, content],
  );
  const post = mapPostRow(
    selectOne(`${POSTS_BASE_QUERY} WHERE p.id = ?`, [postId]),
  );
  res.status(201).json(post);
});

app.put('/api/posts/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const postRow = selectOne(`${POSTS_BASE_QUERY} WHERE p.id = ?`, [id]);
  if (!postRow) {
    return res.status(404).json({ message: 'Post not found' });
  }
  if (postRow.user_id !== userId) {
    return res.status(403).json({ message: 'Only author can update the post' });
  }
  const { title, content } = req.body ?? {};
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }
  runMutation(
    'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, content, id],
  );
  const updated = mapPostRow(
    selectOne(`${POSTS_BASE_QUERY} WHERE p.id = ?`, [id]),
  );
  res.json(updated);
});

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const postRow = selectOne(`${POSTS_BASE_QUERY} WHERE p.id = ?`, [id]);
  if (!postRow) {
    return res.status(404).json({ message: 'Post not found' });
  }
  if (postRow.user_id !== userId) {
    return res.status(403).json({ message: 'Only author can delete the post' });
  }
  runMutation('DELETE FROM posts WHERE id = ?', [id]);
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  // Для LocalStorage аутентификации logout происходит на клиенте
  res.json({ success: true });
});

// Простой endpoint для проверки БД (для отладки)
app.get('/api/debug/cars-count', (req, res) => {
  const count = selectOne('SELECT COUNT(*) AS count FROM cars');
  res.json({ count: count?.count || 0 });
});

app.get('/api/debug/cars-list', (req, res) => {
  const rows = selectAll('SELECT id, title, brand, model, price FROM cars ORDER BY id LIMIT 10');
  res.json({ items: rows });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});
