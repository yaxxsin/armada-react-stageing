export default function EmptyState({ sessionRole, hasFleet, onAddVehicle }) {
  if (!hasFleet) {
    return (
      <div className="empty-state">
        <h2>Belum ada kendaraan</h2>
        <p>
          {sessionRole === 'edit'
            ? 'Tambahkan kendaraan pertama untuk mulai memonitor pajak, keur, dan servis.'
            : 'Belum ada kendaraan yang diinput. Kamu sedang dalam mode view only.'}
        </p>
        {sessionRole === 'edit' && (
          <>
            <br />
            <button className="btn" onClick={onAddVehicle}>
              + Tambah Kendaraan
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="empty-state">
      <h2>Tidak ditemukan</h2>
      <p>Coba ubah kata kunci pencarian atau filter.</p>
    </div>
  );
}
