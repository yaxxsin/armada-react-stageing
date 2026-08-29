import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config.ts';
import { query } from './db.ts';
import { recordSnapshot } from './services/fleetService.ts';
import { csrfProtection, setCsrfCookie } from './middleware/csrf.ts';
import { auditLog } from './middleware/audit.ts';

import authRoutes from './routes/auth.ts';
import vehicleRoutes from './routes/vehicles.ts';
import historyRoutes from './routes/history.ts';
import statsRoutes from './routes/stats.ts';
import importRoutes from './routes/import.ts';
import auditRoutes from './routes/audit.ts';
import userRoutes from './routes/users.ts';

const app = express();

app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
});

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, db: 'ok' });
  } catch (e) {
    res.status(503).json({ ok: false, db: e.message });
  }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', csrfProtection, auditLog('vehicle'), vehicleRoutes);
app.use('/api/vehicles', csrfProtection, auditLog('service_history'), historyRoutes);
app.use('/api', strictLimiter, csrfProtection, importRoutes);
app.use('/api', statsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);

// Record an initial snapshot on boot.
recordSnapshot()
  .then(() => console.log('Initial fleet snapshot recorded.'))
  .catch((e) => console.error('Snapshot on boot failed:', e.message));

app.listen(config.PORT, () => {
  console.log(`Armada API listening on http://localhost:${config.PORT}`);
});

export default app;