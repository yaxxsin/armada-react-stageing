import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const { users } = await api('/users');
      setUsers(users);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="loading">Memuat pengguna…</div>;
  if (error) return <div className="auth-error">{error}</div>;

  return (
    <div className="panel-box">
      <div className="head">Pengguna</div>
      <div className="list">
        {users.length === 0 ? (
          <div className="empty-rem">Tidak ada pengguna.</div>
        ) : (
          users.map((u) => (
            <div className="rem-item" key={u.id}>
              <span className="plat">{u.email}</span>
              <span className="msg">{u.name || '-'}</span>
              <span
                className="scope-badge shared"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleRole(u.id, u.role)}
                title="Klik untuk ganti role"
              >
                {u.role}
              </span>
              {u.role !== 'admin' && (
                <button
                  className="btn danger small"
                  onClick={() => deleteUser(u.id)}
                >
                  Hapus
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}