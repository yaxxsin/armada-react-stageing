import { useState, useCallback, useEffect, useRef } from 'react';
import { api, apiPost, apiPut, apiDelete } from '../api/client';

export default function useFleet() {
  const [fleet, setFleet] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const notifiedRef = useRef(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehRes, snapRes] = await Promise.all([
        api('/vehicles'),
        api('/snapshots'),
      ]);
      setFleet(vehRes.vehicles || []);

      let snaps = snapRes.snapshots || [];
      setSnapshots(snaps);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Actions ───────────────────────────────────────
  const addVehicle = useCallback(
    async (data) => {
      await apiPost('/vehicles', data);
      await loadAll();
    },
    [loadAll]
  );

  const updateVehicle = useCallback(
    async (data) => {
      await apiPut('/vehicles/' + data.id, data);
      await loadAll();
    },
    [loadAll]
  );

  const deleteVehicle = useCallback(
    async (id) => {
      await apiDelete('/vehicles/' + id);
      await loadAll();
    },
    [loadAll]
  );

  const addHistory = useCallback(
    async (vehId, histEntry) => {
      await apiPost('/vehicles/' + vehId + '/history', histEntry);
      await loadAll();
    },
    [loadAll]
  );

  const deleteHistory = useCallback(
    async (vehId, histId) => {
      await apiDelete('/vehicles/' + vehId + '/history/' + histId);
      await loadAll();
    },
    [loadAll]
  );

  const importData = useCallback(
    async (incoming) => {
      await apiPost('/vehicles/import', { vehicles: incoming });
      await loadAll();
    },
    [loadAll]
  );

  const toggleNotif = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Browser ini tidak mendukung notifikasi.');
      return;
    }
    const perm = await Notification.requestPermission();
    const granted = perm === 'granted';
    setNotifGranted(granted);

    if (granted && !notifiedRef.current) {
      const { reminders } = await api('/reminders').catch(() => ({ reminders: [] }));
      const urgent = (reminders || []).filter((r) => r.status === 'red');
      if (urgent.length > 0) {
        try {
          new Notification('Armada Control 104 Group', {
            body:
              urgent.length +
              ' kendaraan terlambat perpanjangan/servis. Buka aplikasi untuk detail.',
          });
        } catch {
          /* noop */
        }
      }
      notifiedRef.current = true;
    }
  }, []);

  return {
    fleet,
    snapshots,
    loading,
    error,
    notifGranted,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addHistory,
    deleteHistory,
    importData,
    toggleNotif,
  };
}
