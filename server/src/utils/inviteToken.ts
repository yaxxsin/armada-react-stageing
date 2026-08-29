import crypto from 'node:crypto';

export function generateToken() {
  const raw = crypto.randomBytes(18).toString('base64url');
  return `armd_${raw}`;
}
