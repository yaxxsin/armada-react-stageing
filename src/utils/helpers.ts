import {
  DEFAULTS,
  computeVehicle,
  buildReminders,
  statusLabel,
  worstStatus,
  latestHistory,
  daysBetween,
} from '../../shared/fleet.ts';

// ─── Utility functions ───────────────────────────────
export function uid() {
  return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Export helpers ───────────────────────────────────
export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(fleet) {
  if (fleet.length === 0) {
    alert('Belum ada data untuk diekspor.');
    return;
  }
  const headers = [
    'Merk', 'Plat', 'Tahun', 'Lokasi', 'Pajak Tahunan Berlaku',
    'Pajak 5 Tahun Berlaku', 'Keur Berlaku', 'Odometer',
    'Servis Terakhir Tanggal', 'Servis Terakhir KM', 'Interval KM',
    'Interval Bulan', 'Target KM Servis Berikutnya', 'Catatan',
  ];
  const rows = fleet.map((v) => {
    const last = latestHistory(v);
    const c = computeVehicle(v);
    return [
      v.merk, v.plat, v.tahun, v.lokasi || '',
      v.pajakTahunanBerlaku || '', v.pajak5TahunanBerlaku || '',
      v.keurBerlaku, v.kmSekarang, last ? last.tanggal : '',
      last ? last.km : '', v.intervalKm || DEFAULTS.intervalKm,
      v.intervalBulan || DEFAULTS.intervalBulan, c.nextServiceKm || '',
      (v.catatan || '').replace(/,/g, ';'),
    ];
  });
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      r.map((x) => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(',')
    ),
  ].join('\n');
  downloadBlob(csv, 'armada-104-group.csv', 'text/csv');
}

export function exportJSON(fleet, snapshots) {
  downloadBlob(
    JSON.stringify({ vehicles: fleet, snapshots: snapshots }, null, 2),
    'armada-104-group-backup.json',
    'application/json'
  );
}

export function shareWhatsApp(fleet) {
  const reminders = buildReminders(fleet).slice(0, 15);
  if (reminders.length === 0) {
    alert('Tidak ada pengingat aktif untuk dibagikan.');
    return;
  }
  let text = 'Ringkasan pengingat Armada Control 104 Group:\n\n';
  reminders.forEach((r) => {
    const tag = r.status === 'red' ? '[TERLAMBAT]' : '[SEGERA]';
    text +=
      tag + ' ' + r.plat + ' - ' + r.msg + ': ' +
      (r.days < 0 ? Math.abs(r.days) + ' hari lewat' : r.days + ' hari lagi') +
      '\n';
  });
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// ─── Image resize ────────────────────────────────────
export function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 480;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export { DEFAULTS, computeVehicle, buildReminders, statusLabel, worstStatus, latestHistory, daysBetween };