import { useState, useMemo } from 'react';
import useFleet from './hooks/useFleet';
import { useAuth } from './context/AuthContext';
import {
  buildReminders,
  computeVehicle,
  worstStatus,
  shareWhatsApp,
  uid,
  DEFAULTS,
} from './utils/helpers';
import TopBar from './components/TopBar';
import StatsGrid from './components/StatsGrid';
import ReminderPanel from './components/ReminderPanel';
import TrendChart from './components/TrendChart';
import Toolbar from './components/Toolbar';
import VehicleGrid from './components/VehicleGrid';
import EmptyState from './components/EmptyState';
import VehicleFormModal from './components/VehicleFormModal';
import VehicleDetailModal from './components/VehicleDetailModal';
import SkeletonCard from './components/SkeletonCard';
import SkeletonStats from './components/SkeletonStats';
import SkeletonTable from './components/SkeletonTable';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { user, loading, logout } = useAuth();
  const {
    fleet,
    snapshots,
    loading: fleetLoading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addHistory,
    deleteHistory,
    importData,
    notifGranted,
    toggleNotif,
  } = useFleet();

  // All authenticated users get edit access; non-admin users are read-only.
  const sessionRole = user?.role === 'admin' ? 'edit' : 'view';

  const [authView, setAuthView] = useState('login'); // login | register

  // ─── Filter state ──────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLokasi, setFilterLokasi] = useState('all');

  // ─── Modal state ───────────────────────────────────
  const [formModalVehicle, setFormModalVehicle] = useState(null); // null = closed
  const [detailVehicleId, setDetailVehicleId] = useState(null);

  // ─── Computed values ───────────────────────────────
  const reminders = useMemo(() => buildReminders(fleet), [fleet]);
  const overdue = reminders.filter((r) => r.status === 'red').length;
  const dueSoon = reminders.filter((r) => r.status === 'amber').length;
  const attentionPlats = new Set(reminders.map((r) => r.plat)).size;
  const safe = fleet.length - attentionPlats;

  const lokasiList = useMemo(
    () => [...new Set(fleet.map((v) => v.lokasi).filter(Boolean))].sort(),
    [fleet]
  );

  const filtered = useMemo(() => {
    return fleet.filter((v) => {
      const q = filterText.toLowerCase();
      const matchText =
        !q ||
        (v.merk || '').toLowerCase().includes(q) ||
        (v.plat || '').toLowerCase().includes(q);
      if (!matchText) return false;
      if (filterLokasi !== 'all' && v.lokasi !== filterLokasi) return false;
      if (filterStatus === 'all') return true;
      const c = computeVehicle(v);
      const overall = worstStatus(
        c.pajakTahunanStatus,
        c.pajak5TahunanStatus,
        c.keurStatus,
        c.serviceStatus
      );
      if (filterStatus === 'attention') return overall !== 'ok';
      if (filterStatus === 'overdue') return overall === 'red';
      return true;
    });
  }, [fleet, filterText, filterStatus, filterLokasi]);

  // ─── Handlers ──────────────────────────────────────
  const openAddForm = () => {
    setFormModalVehicle({
      id: uid(),
      merk: '',
      plat: '',
      tahun: '',
      lokasi: '',
      pajakTahunanBerlaku: '',
      pajak5TahunanBerlaku: '',
      keurBerlaku: '',
      intervalKm: DEFAULTS.intervalKm,
      intervalBulan: DEFAULTS.intervalBulan,
      kmSekarang: '',
      catatan: '',
      serviceHistory: [],
      foto: null,
      _existing: false,
    });
  };

  const openEditForm = (id) => {
    const v = fleet.find((x) => x.id === id);
    if (v) setFormModalVehicle({ ...v, _existing: true });
    setDetailVehicleId(null);
  };

  const handleSaveVehicle = async (data, isEditing) => {
    const { _existing, ...cleanData } = data;
    if (isEditing) {
      await updateVehicle(cleanData);
    } else {
      await addVehicle(cleanData);
    }
    setFormModalVehicle(null);
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Hapus kendaraan ini dari daftar armada?')) return;
    await deleteVehicle(id);
    setFormModalVehicle(null);
    setDetailVehicleId(null);
  };

  const handleAddHistory = (vehId, entry) => addHistory(vehId, entry);

  const handleDeleteHistory = (vehId, histId) => deleteHistory(vehId, histId);

  const handleImport = (incoming) => importData(incoming);

  const detailVehicle = detailVehicleId
    ? fleet.find((v) => v.id === detailVehicleId)
    : null;

  // ─── Auth gating ──────────────────────────────────
  if (loading || fleetLoading) {
    return (
      <div className="wrap">
        <SkeletonStats />
        <SkeletonTable />
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <>
        <Login />
        <div className="auth-switch">
          Belum punya akun?{' '}
          <button className="link-btn" onClick={() => setAuthView('register')}>
            Buat akun
          </button>
        </div>
      </>
    ) : (
      <>
        <Register onRegistered={() => setAuthView('login')} />
        <div className="auth-switch">
          Sudah punya akun?{' '}
          <button className="link-btn" onClick={() => setAuthView('login')}>
            Masuk
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="wrap">
      <TopBar
        fleet={fleet}
        snapshots={snapshots}
        user={user}
        onAddVehicle={openAddForm}
        onImport={handleImport}
        onLogout={logout}
        reminders={reminders}
        notifGranted={notifGranted}
        onToggleNotif={toggleNotif}
        onShareWhatsApp={() => shareWhatsApp(fleet)}
      />

      <StatsGrid total={fleet.length} overdue={overdue} dueSoon={dueSoon} safe={safe} />

      <ReminderPanel reminders={reminders} />

      <TrendChart snapshots={snapshots} />

      <Toolbar
        filterText={filterText}
        filterStatus={filterStatus}
        filterLokasi={filterLokasi}
        lokasiList={lokasiList}
        onSearchChange={setFilterText}
        onStatusChange={setFilterStatus}
        onLokasiChange={setFilterLokasi}
      />

      {fleet.length === 0 ? (
        <EmptyState sessionRole={sessionRole} hasFleet={false} onAddVehicle={openAddForm} />
      ) : filtered.length === 0 ? (
        <EmptyState sessionRole={sessionRole} hasFleet={true} />
      ) : (
        <VehicleGrid vehicles={filtered} onOpenDetail={(id) => setDetailVehicleId(id)} />
      )}

      {formModalVehicle && (
        <VehicleFormModal
          vehicle={formModalVehicle}
          sessionRole={sessionRole}
          onSave={handleSaveVehicle}
          onDelete={handleDeleteVehicle}
          onClose={() => setFormModalVehicle(null)}
        />
      )}

      {detailVehicle && (
        <VehicleDetailModal
          vehicle={detailVehicle}
          sessionRole={sessionRole}
          onClose={() => setDetailVehicleId(null)}
          onEdit={openEditForm}
          onDelete={handleDeleteVehicle}
          onAddHistory={handleAddHistory}
          onDeleteHistory={handleDeleteHistory}
        />
      )}
    </div>
  );
}
