export default function ReminderPanel({ reminders }) {
  const daysText = (r) => {
    if (r.msg === 'Servis' && r.km != null) {
      const kmTxt = (r.km < 0 ? 'lewat ' + Math.abs(r.km) : r.km) + ' km';
      if (r.days === null) return kmTxt;
      const dTxt = r.days < 0 ? Math.abs(r.days) + ' hari lewat' : r.days + ' hari lagi';
      return kmTxt + ' / ' + dTxt;
    }
    if (r.days == null) return '-';
    return r.days < 0 ? Math.abs(r.days) + ' hari lewat' : r.days + ' hari lagi';
  };

  return (
    <div className="panel-box">
      <div className="head">Pengingat rutin</div>
      <div className="list">
        {reminders.length === 0 ? (
          <div className="empty-rem">
            Tidak ada pengingat aktif. Semua kendaraan dalam kondisi aman.
          </div>
        ) : (
          reminders.map((r, i) => (
            <div className={`rem-item ${r.status}`} key={i}>
              <span className={`dot ${r.status}`}></span>
              <span className="plat">{r.plat}</span>
              <span className="msg">{r.msg}</span>
              <span className="days">{daysText(r)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
