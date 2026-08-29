import { useState } from 'react';
import { computeVehicle, fmtDate, statusLabel, uid, DEFAULTS } from '../utils/helpers';

export default function VehicleDetailModal({
  vehicle,
  sessionRole,
  onClose,
  onEdit,
  onDelete,
  onAddHistory,
  onDeleteHistory,
}) {
  const v = vehicle;
  const c = computeVehicle(v);
  const hist = [...(v.serviceHistory || [])].sort((a, b) =>
    (b.tanggal || '').localeCompare(a.tanggal || '')
  );

  const [histForm, setHistForm] = useState({
    tanggal: '',
    km: '',
    jenis: '',
    biaya: '',
    bengkel: '',
  });

  const handleHistChange = (key, value) => {
    setHistForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddHistory = () => {
    if (!histForm.tanggal) {
      alert('Tanggal servis wajib diisi.');
      return;
    }
    onAddHistory(v.id, {
      id: uid(),
      tanggal: histForm.tanggal,
      km: histForm.km,
      jenis: histForm.jenis.trim(),
      biaya: histForm.biaya,
      bengkel: histForm.bengkel.trim(),
    });
    setHistForm({ tanggal: '', km: '', jenis: '', biaya: '', bengkel: '' });
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            {v.lokasi && (
              <>
                <span
                  className="loc-tag"
                  style={{ float: 'none', marginBottom: '6px', display: 'inline-block' }}
                >
                  {v.lokasi}
                </span>
                <br />
              </>
            )}
            <span className="plate">{v.plat}</span>
            <div className="merk" style={{ marginTop: '8px' }}>
              {v.merk} {v.tahun ? '· ' + v.tahun : ''}
            </div>
          </div>
          <button className="close-x" onClick={onClose}>
            &times;
          </button>
        </div>

        {v.foto && <img className="hero-photo" src={v.foto} alt={v.merk} />}

        <div className="detail-grid">
          <div className={`dblock ${c.pajakTahunanStatus}`}>
            <div className="t">Pajak tahunan</div>
            <div className="v">{fmtDate(v.pajakTahunanBerlaku)}</div>
            <div className="status">{statusLabel(c.pajakTahunanStatus, c.pajakTahunanDays)}</div>
          </div>
          <div className={`dblock ${c.pajak5TahunanStatus}`}>
            <div className="t">Pajak 5 tahun</div>
            <div className="v">{fmtDate(v.pajak5TahunanBerlaku)}</div>
            <div className="status">{statusLabel(c.pajak5TahunanStatus, c.pajak5TahunanDays)}</div>
          </div>
          <div className={`dblock ${c.keurStatus}`}>
            <div className="t">Keur</div>
            <div className="v">{fmtDate(v.keurBerlaku)}</div>
            <div className="status">{statusLabel(c.keurStatus, c.keurDays)}</div>
          </div>
          <div className={`dblock ${c.serviceStatus}`}>
            <div className="t">Servis berikutnya</div>
            <div className="v">
              {c.nextServiceKm
                ? 'KM ' + Number(c.nextServiceKm).toLocaleString('id-ID')
                : '-'}
              {c.nextServiceDate ? ' · ' + fmtDate(c.nextServiceDate) : ''}
            </div>
            <div className="status">{c.serviceMsg}</div>
          </div>
        </div>

        <div className="detail-row">
          <span className="k">Odometer sekarang</span>
          <span className="v">
            {v.kmSekarang
              ? Number(v.kmSekarang).toLocaleString('id-ID') + ' km'
              : '-'}
          </span>
        </div>
        <div className="detail-row">
          <span className="k">Target KM servis berikutnya</span>
          <span className="v">
            {c.nextServiceKm
              ? Number(c.nextServiceKm).toLocaleString('id-ID') + ' km'
              : '-'}
          </span>
        </div>
        <div className="detail-row">
          <span className="k">Interval servis</span>
          <span className="v">
            {v.intervalKm || DEFAULTS.intervalKm} km / {v.intervalBulan || DEFAULTS.intervalBulan}{' '}
            bulan
          </span>
        </div>
        {v.catatan && (
          <div className="detail-row">
            <span className="k">Catatan</span>
            <span className="v">{v.catatan}</span>
          </div>
        )}

        <div className="section-title">Riwayat servis</div>
        {hist.length === 0 ? (
          <div className="hist-empty">Belum ada riwayat servis.</div>
        ) : (
          <table className="hist-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>KM</th>
                <th>Jenis</th>
                <th>Biaya</th>
                <th>Bengkel</th>
                {sessionRole === 'edit' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.id}>
                  <td>{fmtDate(h.tanggal)}</td>
                  <td>{h.km ? Number(h.km).toLocaleString('id-ID') : '-'}</td>
                  <td>{h.jenis || '-'}</td>
                  <td>{h.biaya ? 'Rp' + Number(h.biaya).toLocaleString('id-ID') : '-'}</td>
                  <td>{h.bengkel || '-'}</td>
                  {sessionRole === 'edit' && (
                    <td className="del" onClick={() => onDeleteHistory(v.id, h.id)}>
                      Hapus
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sessionRole === 'edit' && (
          <div className="add-hist-row">
            <div className="field">
              <label>Tanggal</label>
              <input
                type="date"
                value={histForm.tanggal}
                onChange={(e) => handleHistChange('tanggal', e.target.value)}
              />
            </div>
            <div className="field">
              <label>KM</label>
              <input
                className="mono"
                type="number"
                placeholder="50000"
                value={histForm.km}
                onChange={(e) => handleHistChange('km', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Jenis</label>
              <input
                placeholder="Ganti oli"
                value={histForm.jenis}
                onChange={(e) => handleHistChange('jenis', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Biaya</label>
              <input
                className="mono"
                type="number"
                placeholder="450000"
                value={histForm.biaya}
                onChange={(e) => handleHistChange('biaya', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Bengkel</label>
              <input
                placeholder="Bengkel Jaya"
                value={histForm.bengkel}
                onChange={(e) => handleHistChange('bengkel', e.target.value)}
              />
            </div>
            <button className="btn small" onClick={handleAddHistory}>
              Tambah
            </button>
          </div>
        )}

        <div className="modal-actions">
          {sessionRole === 'edit' && (
            <button className="btn danger" onClick={() => onDelete(v.id)}>
              Hapus kendaraan
            </button>
          )}
          <button className="btn secondary" onClick={onClose}>
            Tutup
          </button>
          {sessionRole === 'edit' && (
            <button className="btn" onClick={() => onEdit(v.id)}>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
