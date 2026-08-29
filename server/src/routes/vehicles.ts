import { Router } from 'express';
import { query } from '../db.ts';
import requireAuth from '../middleware/auth.ts';
import { validate, vehicleSchema } from '../middleware/validate.ts';
import { overallStatus } from '../utils/fleet.ts';
import { toDTO } from '../services/dto.ts';
import { loadAllVehicles, loadVehiclesPaginated, recordSnapshot } from '../services/fleetService.ts';

const router = Router();
router.use(requireAuth);

// GET /api/vehicles?text=&status=&lokasi=&page=1&limit=20
router.get('/', async (req, res) => {
  const {
    text = '',
    status = 'all',
    lokasi = 'all',
    page = '1',
    limit = '50',
  } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const { vehicles, total } = await loadVehiclesPaginated({
    text,
    status,
    lokasi,
    page: pageNum,
    limit: limitNum,
  });
  res.json({ vehicles, total, page: pageNum, limit: limitNum });
});

router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM vehicles WHERE id = $1', [
    req.params.id,
  ]);
  if (rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan.' });
  const { rows: hist } = await query(
    'SELECT * FROM service_history WHERE vehicle_id = $1 ORDER BY tanggal DESC NULLS LAST',
    [req.params.id]
  );
  res.json({ vehicle: toDTO(rows[0], hist) });
});

router.post('/', validate(vehicleSchema), async (req, res) => {
  const d = req.validated;
  const { rows } = await query(
    `INSERT INTO vehicles
       (merk, plat, tahun, lokasi, pajak_tahunan_berlaku, pajak_5tahunan_berlaku,
        keur_berlaku, interval_km, interval_bulan, km_sekarang, catatan, foto, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      d.merk,
      d.plat.toUpperCase(),
      d.tahun || null,
      d.lokasi || null,
      d.pajakTahunanBerlaku || null,
      d.pajak5TahunanBerlaku || null,
      d.keurBerlaku || null,
      d.intervalKm || 5000,
      d.intervalBulan || 6,
      d.kmSekarang ?? null,
      d.catatan || null,
      d.foto ?? null,
      req.user.id,
    ]
  );
  res.status(201).json({ vehicle: toDTO(rows[0], []) });
  recordSnapshot().catch((e) => console.error('snapshot failed', e.message));
});

router.put('/:id', validate(vehicleSchema), async (req, res) => {
  const d = req.validated;
  const { rows } = await query(
    `UPDATE vehicles SET
       merk=$1, plat=$2, tahun=$3, lokasi=$4, pajak_tahunan_berlaku=$5,
       pajak_5tahunan_berlaku=$6, keur_berlaku=$7, interval_km=$8,
       interval_bulan=$9, km_sekarang=$10, catatan=$11, foto=$12
     WHERE id=$13 RETURNING *`,
    [
      d.merk,
      d.plat.toUpperCase(),
      d.tahun || null,
      d.lokasi || null,
      d.pajakTahunanBerlaku || null,
      d.pajak5TahunanBerlaku || null,
      d.keurBerlaku || null,
      d.intervalKm || 5000,
      d.intervalBulan || 6,
      d.kmSekarang ?? null,
      d.catatan || null,
      d.foto ?? null,
      req.params.id,
    ]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Tidak ditemukan.' });
  res.json({ vehicle: toDTO(rows[0], []) });
  recordSnapshot().catch((e) => console.error('snapshot failed', e.message));
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await query('DELETE FROM vehicles WHERE id = $1', [
    req.params.id,
  ]);
  if (rowCount === 0) return res.status(404).json({ error: 'Tidak ditemukan.' });
  res.json({ ok: true });
  recordSnapshot().catch((e) => console.error('snapshot failed', e.message));
});

export default router;
