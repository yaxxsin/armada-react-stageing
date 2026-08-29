import { useRef, useState, useEffect } from 'react';
import { exportCSV, exportJSON } from '../utils/helpers';
import NotificationBell from './NotificationBell';

export default function TopBar({
  fleet,
  snapshots,
  user,
  onAddVehicle,
  onImport,
  onLogout,
  reminders,
  notifGranted,
  onToggleNotif,
  onShareWhatsApp,
}) {
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const initials = (() => {
    const src = user?.name || user?.email || '';
    const parts = src.trim().split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
  })();

  const handleImportFile = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : (parsed.vehicles || []);
      if (!Array.isArray(incoming)) throw new Error('format tidak valid');
      if (
        !confirm(
          'Impor akan MENGGANTI seluruh data armada saat ini (' +
            fleet.length +
            ' kendaraan) dengan ' +
            incoming.length +
            ' kendaraan dari file. Lanjutkan?'
        )
      ) {
        ev.target.value = '';
        return;
      }
      const incomingSnapshots = Array.isArray(parsed) ? undefined : parsed.snapshots;
      onImport(incoming, incomingSnapshots);
      alert('Impor berhasil.');
    } catch {
      alert('Gagal membaca file. Pastikan file JSON hasil ekspor dari aplikasi ini.');
    }
    ev.target.value = '';
  };

  return (
    <>
      <header className="app-header">
        <div className="header-actions">
          <NotificationBell
            reminders={reminders}
            user={user}
            notifGranted={notifGranted}
            onToggleNotif={onToggleNotif}
            onShareWhatsApp={onShareWhatsApp}
          />
          <div className="user-menu" ref={menuRef}>
          <button
            className="avatar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            title={user?.email}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <span className="avatar">{initials}</span>
            <span className="caret">▾</span>
          </button>
          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-head">
                <span className="user-name">{user?.name || user?.email}</span>
                <span className="user-role">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
              </div>
              <button className="btn ghost small block" onClick={onLogout}>
                Keluar
              </button>
            </div>
          )}
          </div>
        </div>
      </header>
      <div className="topbar">
        <div>
          <h1>Armada Control 104 Group</h1>
          <div className="sub">Monitoring pajak, keur, dan jadwal servis seluruh kendaraan</div>
        </div>
        <div className="topbar-actions">
          <div className="action-group">
            <button className="btn secondary small" onClick={() => exportCSV(fleet)}>
              Ekspor CSV
            </button>
            <button className="btn secondary small" onClick={() => exportJSON(fleet, snapshots)}>
              Ekspor JSON
            </button>
            <button className="btn secondary small" onClick={() => fileInputRef.current?.click()}>
              Impor JSON
            </button>
            <button className="btn" onClick={onAddVehicle}>
              + Tambah Kendaraan
            </button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="application/json"
          onChange={handleImportFile}
        />
      </div>
    </>
  );
}
