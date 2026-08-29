import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Data tidak valid.',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.validated = result.data;
    next();
  };
}

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().optional(),
});

export const inviteTokenSchema = z.object({
  label: z.string().optional(),
  maxUses: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().max(100).default(1)
  ),
  expiresInHours: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.number().int().positive().max(8760).optional()
  ),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const emptyToNull = (v) => (v === '' || v === undefined ? null : v);
const num = z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable());
const dateStr = z.preprocess(emptyToNull, z.string().date().nullable());

export const vehicleSchema = z.object({
  merk: z.string().min(1, 'Merk wajib diisi'),
  plat: z.string().min(1, 'Plat nomor wajib diisi'),
  tahun: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  lokasi: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  pajakTahunanBerlaku: dateStr.optional(),
  pajak5TahunanBerlaku: dateStr.optional(),
  keurBerlaku: dateStr.optional(),
  intervalKm: num.optional(),
  intervalBulan: num.optional(),
  kmSekarang: num.optional(),
  catatan: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  foto: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});

export const historySchema = z.object({
  tanggal: z.string().date(),
  km: num.optional(),
  jenis: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  biaya: num.optional(),
  bengkel: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});
