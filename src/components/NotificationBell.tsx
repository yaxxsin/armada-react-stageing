import { useState, useEffect, useRef } from 'react';
import { api, apiPost, apiDelete } from '../api/client';
import UserManagement from './UserManagement';

export default function NotificationBell({
  reminders = [],
  user,
  notifGranted,
  onToggleNotif,
  onShareWhatsApp,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isAdmin = user?.role === 'admin';

  const redCount = reminders.filter((r) => r.status === 'red').length;
  const badge = redCount > 0 ? redCount : reminders.length;

  // ─── Invite tokens (admin) ───────────────────────────
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInHours, setExpiresInHours] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const loadTokens = async () => {
    try {
      const { tokens } = await api('/auth/invite-tokens');
      setTokens(tokens);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (open && isAdmin) loadTokens();
  }, [open, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const generate = async (e) => {
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try {
      const body = {
        label: label || undefined,
        maxUses,
        expiresInHours: expiresInHours || undefined,
      };
      const { token } = await apiPost('/auth/invite-tokens', body);
      setMsg(`Kode undangan: ${token} (salin sebelum ditutup)`);
      setLabel('');
      setMaxUses(1);
      setExpiresInHours('');
      loadTokens();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    try {
      await apiDelete(`/auth/invite-tokens/${id}`);
      loadTokens();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const copy = (t) => navigator.clipboard?.writeText(t).catch(() => {});

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className="bell-btn"
        onClick={() => setOpen((o) => !o)}
        title="Notifikasi & pengaturan"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {badge > 0 && (
          <span className={`bell-badge ${redCount > 0 ? 'red' : 'amber'}`}>{badge}</span>
        )}
      </button>

      {open && (
        <div className="bell-popover">
          <div className="bell-pop-head">
            <span>Notifikasi &amp; Pengaturan</span>
            <span className="scope-badge">{isAdmin ? 'Admin' : 'User'}</span>
          </div>

          <div className="bell-actions">
            <button className="btn secondary small" onClick={onToggleNotif}>
              {notifGranted ? 'Notifikasi browser aktif' : 'Aktifkan notifikasi browser'}
            </button>
            <button className="btn secondary small" onClick={onShareWhatsApp}>
              Kirim ringkasan ke WhatsApp
            </button>
            <div className="note">
              Data disimpan di server (PostgreSQL) dan bisa diakses oleh semua pengguna
              terautentikasi. Notifikasi browser hanya muncul saat tab ini dibuka. Gunakan
              tombol WhatsApp untuk mengirim ringkasan pengingat secara manual.
            </div>
          </div>

          {isAdmin && (
            <div className="invite-section">
              <h4>Kode Undangan (Daftar User Baru)</h4>
              <form className="invite-form" onSubmit={generate}>
                <input placeholder="Label (opsional)" value={label} onChange={(e) => setLabel(e.target.value)} />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  title="Maksimal pemakaian"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Kedaluwarsa (jam)"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                />
                <button className="btn small" type="submit" disabled={busy}>
                  {busy ? 'Memproses…' : 'Buat kode'}
                </button>
              </form>
              {msg && <div className="auth-error">{msg}</div>}
              <ul className="invite-list">
                {tokens.map((t) => (
                  <li key={t.id}>
                    <code onClick={() => copy(t.token)} title="Klik untuk salin">
                      {t.token}
                    </code>
                    <span className="invite-meta">
                      {t.uses}/{t.max_uses}
                      {t.expires_at ? ` · exp ${new Date(t.expires_at).toLocaleString()}` : ''}
                    </span>
                    <button className="btn secondary small" onClick={() => revoke(t.id)}>
                      Hapus
                    </button>
                  </li>
                ))}
                {tokens.length === 0 && <li className="note">Belum ada kode undangan.</li>}
              </ul>
            </div>
          )}

          {isAdmin && (
            <div className="invite-section">
              <h4>Manajemen Pengguna</h4>
              <UserManagement />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
