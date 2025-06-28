import { ResponseCode, TransaksiResponse } from './types';

/**
 * Error khusus yang dilempar ketika API Digiflazz mengembalikan response gagal.
 * Mengandung informasi detail seperti response code (rc) dan message dari API.
 */
export class DigiflazzApiError extends Error {
  /** Kode response dari API Digiflazz */
  public readonly rc: ResponseCode;

  /** Status transaksi ('Gagal', 'Pending') */
  public readonly status: 'Gagal' | 'Pending' | 'Sukses';
  
  /** Seluruh data response yang menyebabkan error */
  public readonly responseData: any;

  constructor(response: Partial<TransaksiResponse>) {
    const message = response.message || 'Terjadi kesalahan pada API Digiflazz';
    super(message);

    this.name = 'DigiflazzApiError';
    this.rc = response.rc || ResponseCode.ApiBuyerProcessingError; // Default error code
    this.status = response.status || 'Gagal';
    this.responseData = response;

    // Untuk menjaga stack trace pada V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DigiflazzApiError);
    }
  }
}

/**
 * Error khusus yang dilempar ketika validasi webhook gagal.
 * Ini bisa karena signature tidak cocok, header hilang, atau format salah.
 */
export class DigiflazzWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DigiflazzWebhookError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DigiflazzWebhookError);
    }
  }
}