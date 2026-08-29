import { query } from '../db.ts';
import { toDTO } from './dto.ts';
import { overallStatus } from '../utils/fleet.ts';

export async function loadAllVehicles() {
  const { rows: vehicles } = await query(
    `SELECT * FROM vehicles ORDER BY created_at DESC`
  );
  const { rows: hist } = await query(
    `SELECT * FROM service_history ORDER BY tanggal DESC NULLS LAST`
  );
  const byVehicle = new Map();
  for (const h of hist) {
    if (!byVehicle.has(h.vehicle_id)) byVehicle.set(h.vehicle_id, []);
    byVehicle.get(h.vehicle_id).push({
      id: h.id,
      tanggal: h.tanggal,
      km: h.km,
      jenis: h.jenis,
      biaya: h.biaya,
      bengkel: h.bengkel,
    });
  }
  return vehicles.map((v) => toDTO(v, byVehicle.get(v.id) || []));
}

export async function loadVehiclesPaginated({
  text = '',
  status = 'all',
  lokasi = 'all',
  page = 1,
  limit = 50,
}) {
  const offset = (page - 1) * limit;

  const { rows: vehicles } = await query(
    `SELECT * FROM vehicles ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const vehicleIds = vehicles.map((v) => v.id);
  let hist = [];
  if (vehicleIds.length > 0) {
    const placeholders = vehicleIds.map((_, i) => `$${i + 3}`).join(',');
    const { rows: rowsHist } = await query(
      `SELECT * FROM service_history WHERE vehicle_id IN (${placeholders}) ORDER BY tanggal DESC NULLS LAST`,
      [...vehicleIds]
    );
    hist = rowsHist;
  }

  const byVehicle = new Map();
  for (const h of hist) {
    if (!byVehicle.has(h.vehicle_id)) byVehicle.set(h.vehicle_id, []);
    byVehicle.get(h.vehicle_id).push({
      id: h.id,
      tanggal: h.tanggal,
      km: h.km,
      jenis: h.jenis,
      biaya: h.biaya,
      bengkel: h.bengkel,
    });
  }

  let result = vehicles.map((v) => toDTO(v, byVehicle.get(v.id) || []));

  const q = String(text).toLowerCase();
  result = result.filter((v) => {
    const matchText =
      !q ||
      (v.merk || '').toLowerCase().includes(q) ||
      (v.plat || '').toLowerCase().includes(q);
    if (!matchText) return false;
    if (lokasi !== 'all' && v.lokasi !== lokasi) return false;
    if (status === 'all') return true;
    const overall = overallStatus({ ...v, history: v.serviceHistory });
    if (status === 'attention') return overall !== 'ok';
    if (status === 'overdue') return overall === 'red';
    return true;
  });

  const total = result.length;

  return { vehicles: result, total };
}

export async function recordSnapshot() {
  const vehicles = await loadAllVehicles();
  let ok = 0;
  let amber = 0;
  let red = 0;
  for (const v of vehicles) {
    const overall = overallStatus({ ...v, history: v.serviceHistory });
    if (overall === 'red') red++;
    else if (overall === 'amber') amber++;
    else ok++;
  }
  const date = new Date().toISOString().slice(0, 10);
  await query(
    `INSERT INTO snapshots (date, ok, amber, red)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (date) DO UPDATE SET ok=$2, amber=$3, red=$4`,
    [date, ok, amber, red]
  );
}

