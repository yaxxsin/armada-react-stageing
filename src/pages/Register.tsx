import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onRegistered }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setBusy(true);
    try {
      await register(email, password, name);
      onRegistered?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Buat Akun</h1>
        <div className="auth-sub">
          Akun pertama otomatis menjadi admin.
        </div>

        <div className="field">
          <label>Nama</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PIC Armada" />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="minimal 6 karakter"
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Memproses…' : 'Daftar'}
        </button>
      </form>
    </div>
  );
}
