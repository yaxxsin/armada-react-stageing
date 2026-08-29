# Armada Control — Pengembangan Plan

## Status Implementasi

### Fase 1 — Cleanup ✅ Selesai
- [x] Hapus `src/utils/storage.js` dan bersihkan impor di `helpers.js`
- [x] Perbaiki hardcoded `sessionRole` di `App.jsx` → `user.role`
- [x] Validasi env vars di startup server (`server/src/config.js`)
- [x] Update `auth.js`, `db.js` untuk menggunakan `config.js`

### Fase 2 — Core ✅ Selesai
- [x] Eliminasi dual status computation → `shared/fleet.js`
- [x] Pagination untuk `GET /api/vehicles` (`?page=&limit=`)
- [x] CSRF protection middleware (`server/src/middleware/csrf.js`)
- [x] Rate limiting lebih luas (import/export endpoint)
- [x] Audit log (`server/src/middleware/audit.js`, `server/src/routes/audit.js`, migrasi `003_audit_log.sql`)

### Fase 3 — Ops ✅ Selesai
- [x] Responsive design improvements (media queries 768px, 480px)
- [x] Loading skeletons (`SkeletonCard`, `SkeletonStats`, `SkeletonTable`)
- [x] Error boundary (`src/components/ErrorBoundary.jsx`)

### Fase 4 — Fitur ✅ Selesai
- [x] TypeScript migration (tsconfig.json, rename .js/.jsx → .ts/.tsx, tsx untuk runtime)
- [x] Production Docker build (`Dockerfile.prod`, `nginx.conf`, `frontend-prod` service)
- [x] Health check diperluas (DB connectivity check)
- [x] Database backups (`server/scripts/backup.ts`)
- [ ] WebSocket real-time notifications
- [ ] Export PDF
- [ ] User management UI

---

## Prioritas Tinggi (Fase 1)

### 1. Hapus `src/utils/storage.js`
- File legacy dari era pre-backend. `useFleet.js` sekarang fetch dari API.
- Tidak dipakai oleh kode manapun yang aktif.
- Sudah dihapus.

### 2. Perbaiki hardcoded `sessionRole` di `App.jsx`
- Baris `src/App.jsx:41`: `const sessionRole = 'edit'` memberikan akses edit ke semua user.
- Diganti dengan `const sessionRole = user?.role === 'admin' ? 'edit' : 'view'`.

### 3. Validasi environment variables di startup server
- `server/src/index.js` langsung `dotenv.config()` tanpa validasi.
- Ditambahkan `server/src/config.js` menggunakan Zod untuk memvalidasi `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `PORT` sebelum server mulai.
- Crash dengan pesan jelas jika env var tidak lengkap.

---

## Prioritas Menengah (Fase 2)

### 4. Eliminasi dual status computation
- `src/utils/helpers.js` (frontend) dan `server/src/utils/fleet.js` (backend) memiliki logika identik.
- Dibuat `shared/fleet.js` yang berisi fungsi murni: `daysBetween`, `statusFromDays`, `worstStatus`, `computeVehicle`, `buildReminders`, `overallStatus`, `statusLabel`, `latestHistory`, `addMonths`.
- Kedua sisi (frontend `helpers.js` dan backend `fleet.js`) kini mengimpor dari `shared/fleet.js`.

### 5. Pagination untuk `GET /api/vehicles`
- Ditambahkan query params `?page=1&limit=50` ke `server/src/routes/vehicles.js`.
- `server/src/services/fleetService.js` menambahkan `loadVehiclesPaginated()`.
- Frontend `useFleet.js` menangani respons paginated `{ vehicles, total, page, limit }`.

### 6. CSRF protection
- Dibuat `server/src/middleware/csrf.js` dengan pola double-submit cookie.
- CSRF token di-set sebagai cookie `_csrf` pada login/register.
- Frontend `api/client.js` membaca cookie `_csrf` dan mengirimnya dalam header `X-CSRF-Token` pada mutasi (POST/PUT/DELETE).
- Middleware CSRF diterapkan pada rute kendaraan dan history.

### 7. Rate limiting lebih luas
- `strictLimiter` (10 req / 15 menit) ditambahkan untuk endpoint import.
- Login tetap di-rate-limit (20 req / 15 menit).

### 8. Audit log
- Migrasi `003_audit_log.sql` membuat tabel `audit_log`.
- Middleware `server/src/middleware/audit.js` mencatat setiap request HTTP ke audit log.
- Endpoint `GET /api/audit`, `GET /api/audit/:id`, `DELETE /api/audit` (admin).
- Route terdaftar di `server/src/index.js`.

---

## Prioritas Rendah (Fase 3 & 4)

### Fase 3 — Ops

### 9. Responsive design
- Tambahkan media queries di `src/index.css` untuk breakpoint 768px dan 480px.
- Modal form fields harus stack vertikal di mobile.
- Toolbar filter harus collapse menjadi dropdown di mobile.

### 10. Loading skeletons
- Ganti teks "Memuat…" dengan skeleton UI components.
- Tambahkan `SkeletonCard`, `SkeletonStats`, `SkeletonTable` di `src/components/`.

### 11. Error boundary
- Buat `src/components/ErrorBoundary.jsx` menggunakan error boundary React.
- Wrap `App` di `main.jsx` dengan `ErrorBoundary`.

### Fase 4 — Fitur

### 12. TypeScript migration
- Buat `tsconfig.json` dengan `allowJs: true`, `checkJs: false`.
- Mulai dari `server/src/` (backend).

### 13. Real-time notifications (WebSocket)
- Tambahkan `socket.io` atau `ws` ke backend.
- Frontend `NotificationBell` terhubung ke WebSocket.

### 14. Export PDF
- Tambahkan library `pdfkit` untuk laporan armada.
- Endpoint `GET /api/vehicles/export?format=pdf`.

### 15. User management UI
- Halaman admin untuk mengelola users.
- Endpoint `GET /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`.

### 16. Production Docker build
- `Dockerfile` frontend menjalankan `vite dev` — tidak cocok untuk production.
- Buat `Dockerfile.prod` dengan `vite build` + nginx.
- Tambahkan service `frontend-prod` di `docker-compose.yml`.

### 17. Health check diperluas
- `GET /api/health` sebelumnya hanya cek server hidup.
- Diperluas untuk juga `SELECT 1` ke PostgreSQL.
- Response format: `{ ok: true, db: 'ok' }` atau `{ ok: false, db: 'error' }`.

### 18. Database backups
- Tambahkan script backup PostgreSQL ke `server/scripts/backup.js`.
- Gunakan `pg_dump` dengan format custom (`-F c`).
- Backup disimpan ke `backups/` di root proyek.

---

## Catatan

- Semua perubahan harus diuji secara manual sebelum di-commit.
- Tidak ada test coverage saat ini — pertimbangkan menambahkan Vitest untuk unit test di Fase 3+.
- Setiap item harus di-review oleh minimal satu orang sebelum merge ke main.