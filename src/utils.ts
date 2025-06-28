import { createHash } from 'crypto';

/**
 * Membuat signature MD5 sesuai format Digiflazz.
 * @param username - Username Digiflazz Anda.
 * @param apiKey - Production Key (API Key) Anda.
 * @param identifier - String unik untuk request (contoh: 'depo', 'pricelist', atau ref_id).
 * @returns Signature dalam format MD5 hex string.
 */
export function generateSign(username: string, apiKey: string, identifier: string): string {
  const data = `${username}${apiKey}${identifier}`;
  return createHash('md5').update(data).digest('hex');
}