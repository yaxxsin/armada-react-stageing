function dateToStr(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function toDTO(v, history = []) {
  return {
    id: v.id,
    merk: v.merk,
    plat: v.plat,
    tahun: v.tahun,
    lokasi: v.lokasi,
    pajakTahunanBerlaku: dateToStr(v.pajak_tahunan_berlaku),
    pajak5TahunanBerlaku: dateToStr(v.pajak_5tahunan_berlaku),
    keurBerlaku: dateToStr(v.keur_berlaku),
    intervalKm: v.interval_km,
    intervalBulan: v.interval_bulan,
    kmSekarang: v.km_sekarang,
    catatan: v.catatan,
    foto: v.foto,
    createdBy: v.created_by,
    serviceHistory: history,
  };
}
