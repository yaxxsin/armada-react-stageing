import { Router } from 'express';
import { query } from '../db.ts';
import { validate, registerSchema, loginSchema, inviteTokenSchema } from '../middleware/validate.ts';
import requireAuth, { requireAdmin } from '../middleware/auth.ts';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from '../utils/auth.ts';
import { generateToken } from '../utils/inviteToken.ts';
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrf.ts';

const router = Router();

async function consumeInviteToken(raw) {
  const { rows } = await query(
    `SELECT * FROM registration_tokens WHERE token = $1`,
    [raw]
  );
  const rec = rows[0];
  if (!rec) return { error: 'Kode undangan tidak valid.' };
  if (rec.uses >= rec.max_uses) return { error: 'Kode undangan sudah habis dipakai.' };
  if (rec.expires_at && new Date(rec.expires_at) < new Date()) {
    return { error: 'Kode undangan sudah kedaluwarsa.' };
  }
  await query(
    `UPDATE registration_tokens SET uses = uses + 1 WHERE id = $1`,
    [rec.id]
  );
  return { ok: true };
}

// First user becomes admin automatically; afterwards anyone can register as 'user'.
router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.validated;
  const lower = email.toLowerCase();

  const existing = await query('SELECT id FROM users WHERE email = $1', [lower]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ error: 'Email sudah terdaftar.' });
  }

  const { rows: count } = await query('SELECT COUNT(*)::int AS n FROM users');
  const isFirst = count[0].n === 0;
  const finalRole = isFirst ? 'admin' : 'user';

  const hash = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at`,
    [lower, hash, name || null, finalRole]
  );
  const csrf = generateCsrfToken();
  setCsrfCookie(res, csrf);
  res.status(201).json({ user: rows[0], csrfToken: csrf });
});

// ── Invite token management (admin only) ─────────────────────────────────────
router.post('/invite-tokens', requireAuth, requireAdmin, validate(inviteTokenSchema), async (req, res) => {
  const { label, maxUses, expiresInHours } = req.validated;
  const token = generateToken();
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 3600 * 1000)
    : null;
  const { rows } = await query(
    `INSERT INTO registration_tokens (token, label, created_by, max_uses, expires_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, token, label, max_uses, uses, expires_at, created_at`,
    [token, label || null, req.user.id, maxUses, expiresAt]
  );
  res.status(201).json({ token: rows[0] });
});

router.get('/invite-tokens', requireAuth, requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT t.id, t.token, t.label, t.max_uses, t.uses, t.expires_at, t.created_at,
            u.email AS created_by_email
     FROM registration_tokens t
     LEFT JOIN users u ON u.id = t.created_by
     ORDER BY t.created_at DESC`
  );
  res.json({ tokens: rows });
});

router.delete('/invite-tokens/:id', requireAuth, requireAdmin, async (req, res) => {
  const { rowCount } = await query('DELETE FROM registration_tokens WHERE id = $1', [
    req.params.id,
  ]);
  if (rowCount === 0) return res.status(404).json({ error: 'Tidak ditemukan.' });
  res.json({ ok: true });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated;
  const { rows } = await query(
    'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }
  const user = rows[0];
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Email atau password salah.' });
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);
  const csrf = generateCsrfToken();
  setCsrfCookie(res, csrf);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    csrfToken: csrf,
  });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.clearCookie('_csrf');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

export default router;
