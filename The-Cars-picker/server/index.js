import express from 'express';
import cors from 'cors';

import cars from './mock-cars.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory users and favorites (MVP only, not for production)
const users = [];
const sessions = new Map(); // token -> userId
const favorites = new Map(); // userId -> Set(carId)

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }
  const [, token] = authHeader.split(' ');
  const userId = sessions.get(token);
  if (!userId) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  req.userId = userId;
  next();
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
  };

  // Price detection like "до 2 млн" or "до 2000000"
  const priceMatch = text.match(/до\s+(\d+)\s*([мm]лн)?/);
  if (priceMatch) {
    let value = Number(priceMatch[1]);
    const hasMillion = Boolean(priceMatch[2]);
    if (hasMillion) {
      value = value * 1_000_000;
    }
    filters.price_max = value;
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

  // Tags
  if (text.includes('комфорт') || text.includes('комфортную')) {
    filters.tags.push('comfort');
  }
  if (text.includes('семейн')) {
    filters.tags.push('family');
  }
  if (text.includes('экономич') || text.includes('экономную')) {
    filters.tags.push('economy');
  }
  if (text.includes('большой багажник') || text.includes('большим багажником')) {
    filters.tags.push('big_trunk');
  }

  res.json({ filters });
});

// Car search
app.post('/api/cars/search', (req, res) => {
  const { filters = {} } = req.body ?? {};
  let result = [...cars];

  if (filters.price_max != null) {
    result = result.filter((c) => c.price <= filters.price_max);
  }
  if (filters.price_min != null) {
    result = result.filter((c) => c.price >= filters.price_min);
  }
  if (Array.isArray(filters.body_type) && filters.body_type.length > 0) {
    const set = new Set(filters.body_type.map((x) => x.toLowerCase()));
    result = result.filter((c) => set.has(c.body_type.toLowerCase()));
  }
  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    const set = new Set(filters.tags.map((x) => x.toLowerCase()));
    result = result.filter((c) =>
      (c.tags ?? []).some((t) => set.has(String(t).toLowerCase())),
    );
  }

  res.json({ items: result });
});

// Cars list (simple)
app.get('/api/cars', (req, res) => {
  res.json({ items: cars });
});

// Car details
app.get('/api/cars/:id', (req, res) => {
  const { id } = req.params;
  const car = cars.find((c) => String(c.id) === String(id));
  if (!car) {
    return res.status(404).json({ message: 'Car not found' });
  }
  res.json(car);
});

// Auth (MVP, no hashing)
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const user = {
    id: users.length + 1,
    email,
    password,
    name: name || 'User',
  };
  users.push(user);
  const token = generateToken();
  sessions.set(token, user.id);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken();
  sessions.set(token, user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// Favorites
app.get('/api/favorites', authMiddleware, (req, res) => {
  const userId = req.userId;
  const favSet = favorites.get(userId) ?? new Set();
  const favCars = cars.filter((c) => favSet.has(c.id));
  res.json({ items: favCars });
});

app.post('/api/favorites', authMiddleware, (req, res) => {
  const userId = req.userId;
  const { carId } = req.body ?? {};
  const car = cars.find((c) => c.id === carId);
  if (!car) {
    return res.status(404).json({ message: 'Car not found' });
  }
  const favSet = favorites.get(userId) ?? new Set();
  if (favSet.has(carId)) {
    favSet.delete(carId);
  } else {
    favSet.add(carId);
  }
  favorites.set(userId, favSet);
  res.json({ success: true, favorites: Array.from(favSet) });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});


