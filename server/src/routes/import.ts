import { Router } from 'express';
import { query } from '../db.ts';
import requireAuth from '../middleware/auth.ts';
import { loadAllVehicles } from '../services/fleetService.ts';
import { computeVehicle } from '../utils/fleet.ts';

const router = Router();
router.use(requireAuth);

// POST /api/vehicles/import  body: { vehicles: [...] }
router.post('/import', async (req, res) => {
  const incoming = req.body?.vehicles;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Format tidak valid. Butuh { vehicles: [...] }.' });
  }
  // Skip plates that already exist to avoid duplicates on re-import.
  const { rows: existing } = await query('SELECT plat FROM vehicles');
  const owned = new Set(existing.map((r) => (r.plat || '').toUpperCase()));

  let inserted = 0;
  for (const v of incoming) {
    const plat = (v.plat || '').toUpperCase();
    if (!v.merk || !plat || owned.has(plat)) continue;
    await query(
      `INSERT INTO vehicles
         (merk, plat, tahun, lokasi, pajak_tahunan_berlaku, pajak_5tahunan_berlaku,
          keur_berlaku, interval_km, interval_bulan, km_sekarang, catatan, foto, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        v.merk,
        plat,
        v.tahun || null,
        v.lokasi || null,
        v.pajakTahunanBerlaku || null,
        v.pajak5TahunanBerlaku || null,
        v.keurBerlaku || null,
        v.intervalKm || 5000,
        v.intervalBulan || 6,
        v.kmSekarang ?? null,
        v.catatan || null,
        v.foto ?? null,
        req.user.id,
      ]
    );
    inserted++;
    owned.add(plat);
  }
  res.json({ ok: true, imported: inserted });
});

// GET /api/vehicles/export?format=json|csv
router.get('/export', async (req, res) => {
  const vehicles = await loadAllVehicles();
  const format = (req.query.format || 'json').toLowerCase();
  if (format === 'csv') {
    const headers = [
      'Merk', 'Plat', 'Tahun', 'Lokasi', 'Pajak Tahunan Berlaku',
      'Pajak 5 Tahun Berlaku', 'Keur Berlaku', 'Odometer',
      'Servis Terakhir Tanggal', 'Servis Terakhir KM', 'Interval KM',
      'Interval Bulan', 'Target KM Servis Berikutnya', 'Catatan',
    ];
    const rows = vehicles.map((v) => {
      const last = (v.serviceHistory || []).filter((h) => h.tanggal).sort((a, b) =>
        (b.tanggal || '').localeCompare(a.tanggal || '')
      )[0];
      return [
        v.merk, v.plat, v.tahun, v.lokasi || '',
        v.pajakTahunanBerlaku || '', v.pajak5TahunanBerlaku || '',
        v.keurBerlaku, v.kmSekarang, last ? last.tanggal : '',
        last ? last.km : '', v.intervalKm || 5000,
        v.intervalBulan || 6, computeVehicle({ ...v, history: v.serviceHistory }).nextServiceKm || '', v.catatan || '',
      ];
    });
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((x) => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(',')
      ),
    ].join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename="armada-104-group.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(csv);
  }
  res.setHeader('Content-Disposition', 'attachment; filename="armada-104-group.json"');
  res.json({ vehicles });
});

export default router;
