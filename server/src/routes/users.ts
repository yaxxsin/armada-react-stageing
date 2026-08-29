import { Router } from 'express';
import { query } from '../db.ts';
import requireAuth from '../middleware/auth.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { auditLog } from '../middleware/audit.ts';

const router = Router();
router.use(requireAuth);

// GET /api/users
router.get('/', requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC`
  );
  res.json({ users: rows });
});

// PATCH /api/users/:id
router.patch(
  '/:id',
  requireAdmin,
  auditLog('user'),
  async (req, res) => {
    const { role } = req.body;
    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid.' });
    }
    const { rowCount } = await query(
      `UPDATE users SET role = $1 WHERE id = $2`,
      [role || 'user', req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    res.json({ ok: true });
  }
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  requireAdmin,
  auditLog('user'),
  async (req, res) => {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
    }
    const { rowCount } = await query(
      `DELETE FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    res.json({ ok: true });
  }
);

export default router;