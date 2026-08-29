import { useState, useRef } from 'react';
import { uid, DEFAULTS, resizeImageFile } from '../utils/helpers';

export default function VehicleFormModal({ vehicle, onSave, onDelete, onClose, _sessionRole }) {
  const isEditing = !!vehicle?.id && vehicle._existing;
  const [form, setForm] = useState({
    merk: vehicle?.merk || '',
    plat: vehicle?.plat || '',
    tahun: vehicle?.tahun || '',
    lokasi: vehicle?.lokasi || '',
    pajakTahunanBerlaku: vehicle?.pajakTahunanBerlaku || '',
    pajak5TahunanBerlaku: vehicle?.pajak5TahunanBerlaku || '',
    keurBerlaku: vehicle?.keurBerlaku || '',
    intervalKm: vehicle?.intervalKm || DEFAULTS.intervalKm,
    intervalBulan: vehicle?.intervalBulan || DEFAULTS.intervalBulan,
    kmSekarang: vehicle?.kmSekarang || '',
    catatan: vehicle?.catatan || '',
  });
  const [foto, setFoto] = useState(vehicle?.foto || null);
  const fileRef = useRef(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFotoSelect = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const resized = await resizeImageFile(file);
      setFoto(resized);
    } catch {
      alert('Gagal memproses foto. Coba file lain.');
    }
    ev.target.value = '';
  };

  const handleSave = () => {
    if (!form.merk.trim() || !form.plat.trim()) {
      alert('Merk dan plat nomor wajib diisi.');
      return;
    }
    const data = {
      id: vehicle?.id || uid(),
      ...form,
      plat: form.plat.trim().toUpperCase(),
      merk: form.merk.trim(),
      lokasi: form.lokasi.trim(),
      catatan: form.catatan.trim(),
      serviceHistory: vehicle?.serviceHistory || [],
      foto: foto,
    };
    onSave(data, isEditing);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{isEditing ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</h2>
          <button className="close-x" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="field">
          <label>Foto kendaraan</label>
          <div className="foto-upload">
            {foto ? (
              <img className="foto-preview" src={foto} alt="Preview" />
            ) : (
              <div className="foto-preview empty">Belum ada foto</div>
            )}
            <button
              type="button"
              className="btn secondary small"
              onClick={() => fileRef.current?.click()}
            >
              Pilih foto
            </button>
            <button type="button" className="btn ghost small" onClick={() => setFoto(null)}>
              Hapus foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFotoSelect}
            />
          </div>
        </div>

        <div className="field">
          <label>Merk / model</label>
          <input
            value={form.merk}
            onChange={(e) => handleChange('merk', e.target.value)}
            placeholder="Toyota Hilux"
          />
        </div>

        <div className="row3">
          <div className="field">
            <label>Plat nomor</label>
            <input
              className="mono"
              value={form.plat}
              onChange={(e) => handleChange('plat', e.target.value)}
              placeholder="B 1234 XYZ"
            />
          </div>
          <div className="field">
            <label>Tahun</label>
            <input
              className="mono"
              value={form.tahun}
              onChange={(e) => handleChange('tahun', e.target.value)}
              placeholder="2021"
            />
          </div>
          <div className="field">
            <label>Lokasi / cabang</label>
            <input
              value={form.lokasi}
              onChange={(e) => handleChange('lokasi', e.target.value)}
              placeholder="Gudang Cakung"
            />
          </div>
        </div>

        <div className="section-title">Pajak &amp; keur</div>
        <div className="row3">
          <div className="field">
            <label>Pajak tahunan berlaku sampai</label>
            <input
              type="date"
              value={form.pajakTahunanBerlaku}
              onChange={(e) => handleChange('pajakTahunanBerlaku', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Pajak 5 tahun berlaku sampai</label>
            <input
              type="date"
              value={form.pajak5TahunanBerlaku}
              onChange={(e) => handleChange('pajak5TahunanBerlaku', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Keur berlaku sampai</label>
            <input
              type="date"
              value={form.keurBerlaku}
              onChange={(e) => handleChange('keurBerlaku', e.target.value)}
            />
          </div>
        </div>

        <div className="section-title">Servis</div>
        <div className="row2">
          <div className="field">
            <label>Interval servis (km)</label>
            <input
              className="mono"
              type="number"
              value={form.intervalKm}
              onChange={(e) => handleChange('intervalKm', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Interval servis (bulan)</label>
            <input
              className="mono"
              type="number"
              value={form.intervalBulan}
              onChange={(e) => handleChange('intervalBulan', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Odometer saat ini (km)</label>
          <input
            className="mono"
            type="number"
            value={form.kmSekarang}
            onChange={(e) => handleChange('kmSekarang', e.target.value)}
            placeholder="48200"
          />
        </div>

        <div className="field">
          <label>Catatan</label>
          <input
            value={form.catatan}
            onChange={(e) => handleChange('catatan', e.target.value)}
            placeholder="Opsional"
          />
        </div>

        {!isEditing && (
          <div className="note" style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Riwayat servis bisa ditambahkan setelah kendaraan disimpan, lewat halaman detail.
          </div>
        )}

        <div className="modal-actions">
          {isEditing && onDelete && (
            <button className="btn danger" onClick={() => onDelete(vehicle.id)}>
              Hapus
            </button>
          )}
          <button className="btn secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn" onClick={handleSave}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
