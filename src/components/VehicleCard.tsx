import { computeVehicle } from '../utils/helpers';

export default function VehicleCard({ vehicle, onClick }) {
  const v = vehicle;
  const c = computeVehicle(v);

  return (
    <div className="card" onClick={onClick}>
      {v.foto && <img className="card-photo" src={v.foto} alt={v.merk} />}
      {v.lokasi && <span className="loc-tag">{v.lokasi}</span>}
      <span className="plate">{v.plat || '-'}</span>
      <div className="merk">{v.merk || 'Tanpa nama'}</div>
      <div className="tahun">{v.tahun || ''}</div>
      <div className="rail">
        <div className={`seg ${c.pajakTahunanStatus}`}></div>
        <div className={`seg ${c.pajak5TahunanStatus}`}></div>
        <div className={`seg ${c.keurStatus}`}></div>
        <div className={`seg ${c.serviceStatus}`}></div>
      </div>
      <div className="rail-lbl">
        <span>Pajak 1th</span>
        <span>Pajak 5th</span>
        <span>Keur</span>
        <span>Servis</span>
      </div>
      <div className="km">
        Odometer: {v.kmSekarang ? Number(v.kmSekarang).toLocaleString('id-ID') + ' km' : '-'}
      </div>
      <div className="next-service">
        Servis berikut di:{' '}
        {c.nextServiceKm ? Number(c.nextServiceKm).toLocaleString('id-ID') + ' km' : '-'}
      </div>
    </div>
  );
}
