import { createHmac, timingSafeEqual } from 'crypto';
import {
  WebhookHandlerOptions,
  WebhookEvent,
  VerifiedWebhookPayload,
  WebhookTransactionPayload,
  PingEventPayload,
} from './types';
import { DigiflazzWebhookError } from './errors';

/**
 * Memverifikasi signature webhook dan mem-parsing payload-nya.
 * Fungsi ini dirancang untuk aman dari timing attacks.
 *
 * @param options - Opsi yang berisi rawBody, headers, dan secret key.
 * @returns Promise yang resolve dengan event dan payload yang sudah terverifikasi.
 * @throws {DigiflazzWebhookError} Jika verifikasi gagal.
 * @docs https://developer.digiflazz.com/api/buyer/webhook/
 */
export function verifyAndParseWebhook(
  options: WebhookHandlerOptions
): VerifiedWebhookPayload<WebhookTransactionPayload | PingEventPayload> {
  const { rawBody, headers, secret } = options;

  if (!secret) {
    throw new DigiflazzWebhookError('Secret key untuk webhook tidak boleh kosong.');
  }

  const signatureHeader = headers['x-hub-signature'] || headers['X-Hub-Signature'];
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    throw new DigiflazzWebhookError('Header "X-Hub-Signature" tidak ditemukan atau tidak valid.');
  }

  const eventHeader = (headers['x-digiflazz-event'] || headers['X-Digiflazz-Event']) as WebhookEvent;
  if (!eventHeader) {
    throw new DigiflazzWebhookError('Header "X-Digiflazz-Event" tidak ditemukan.');
  }

  const signatureParts = signatureHeader.split('=');
  if (signatureParts.length !== 2 || signatureParts[0] !== 'sha1') {
    throw new DigiflazzWebhookError('Format signature tidak valid. Harus "sha1=...".');
  }

  const receivedSignature = signatureParts[1];

  // Hitung signature yang diharapkan
  const expectedSignature = createHmac('sha1', secret).update(rawBody).digest('hex');

  // Bandingkan signature dengan aman untuk mencegah timing attacks
  const receivedSignatureBuffer = Buffer.from(receivedSignature, 'hex');
  const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    receivedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(receivedSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new DigiflazzWebhookError('Signature tidak cocok.');
  }

  // Jika signature cocok, parsing body dan kembalikan
  const parsedBody = JSON.parse(rawBody.toString());

  // Payload 'ping' tidak berada di dalam properti 'data', sedangkan event lain berada.
  const payload =
    eventHeader === WebhookEvent.Ping ? parsedBody : parsedBody.data;

  return {
    event: eventHeader,
    payload,
  };
}