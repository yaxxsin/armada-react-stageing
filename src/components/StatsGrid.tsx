export default function StatsGrid({ total, overdue, dueSoon, safe }) {
  return (
    <div className="stats">
      <div className="stat">
        <div className="num mono">{total}</div>
        <div className="lbl">Total armada</div>
      </div>
      <div className="stat alert">
        <div className="num mono">{overdue}</div>
        <div className="lbl">Terlambat</div>
      </div>
      <div className="stat warn">
        <div className="num mono">{dueSoon}</div>
        <div className="lbl">Perlu perhatian</div>
      </div>
      <div className="stat ok">
        <div className="num mono">{safe}</div>
        <div className="lbl">Kondisi aman</div>
      </div>
    </div>
  );
}
