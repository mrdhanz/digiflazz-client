/**
 * Enum untuk Response Code (RC) dari API Digiflazz.
 * Memberikan konteks yang jelas untuk setiap kode yang diterima.
 * @docs https://developer.digiflazz.com/api/buyer/response-code/
 */
export enum ResponseCode {
  Sukses = '00',
  Timeout = '01',
  TransaksiGagal = '02',
  Pending = '03',
  PayloadError = '40',
  InvalidSignature = '41',
  ApiBuyerProcessingError = '42',
  SkuNotFound = '43',
  SaldoTidakCukup = '44',
  IpNotRecognized = '45',
  TransaksiSudahAda = '47',
  RefIdTidakUnik = '49',
  TransaksiTidakDitemukan = '50',
  NomorDiblokir = '51',
  PrefixTidakSesuai = '52',
  ProdukSellerTidakTersedia = '53',
  NomorTujuanSalah = '54',
  ProdukGangguan = '55',
  LimitSaldoSeller = '56',
  DigitTidakSesuai = '57',
  SedangCutOff = '58',
  TujuanDiLuarWilayah = '59',
  TagihanBelumTersedia = '60',
  BelumPernahDeposit = '61',
  SellerSedangGangguan = '62',
  TidakSupportTransaksiMulti = '63',
  GagalTarikTiket = '64',
  LimitTransaksiMulti = '65',
  SellerCutOff = '66',
  SellerBelumTerverifikasi = '67',
  StokHabis = '68',
  KwhMelebihiBatas = '73',
  TransaksiRefund = '74',
  AkunDiblokirSeller = '80',
  SellerDiblokirAnda = '81',
  AkunBelumTerverifikasi = '82',
  LimitPricelist = '83',
  NominalTidakValid = '84',
  LimitTransaksi = '85',
  LimitCekPln = '86',
  RouterIssue = '99',
}

/** Struktur dasar response dari API Digiflazz */
export interface DigiflazzBaseResponse<T> {
  data: T;
}

// --- Tipe untuk Cek Saldo ---
export interface CekSaldoResponse {
  deposit: number;
}
// --- Tipe untuk Deposit ---

/**
 * Nama bank yang didukung untuk permintaan deposit.
 * PENTING: Sesuai dokumentasi, nama bank harus dalam huruf besar.
 */
export type BankName = 'BCA' | 'MANDIRI' | 'BRI' | 'BNI';

/**
 * Parameter untuk membuat tiket deposit.
 * @docs https://developer.digiflazz.com/api/buyer/deposit/#request
 */
export interface DepositRequest {
  /** Jumlah deposit yang diinginkan (misal: 100000). */
  amount: number;
  /**
   * Bank tujuan transfer Anda.
   * Gunakan salah satu dari nilai yang didukung: 'BCA', 'MANDIRI', 'BRI', 'BNI'.
   */
  Bank: BankName;
  /** Nama pemilik rekening yang akan melakukan transfer. */
  owner_name: string;
}

/**
 * Response dari permintaan tiket deposit yang sukses.
 * @docs https://developer.digiflazz.com/api/buyer/deposit/#response
 */
export interface DepositResponse {
  rc: ResponseCode;
  /** Jumlah yang harus ditransfer, sudah termasuk kode unik. */
  amount: number;
  /** Berita/catatan yang harus disertakan saat transfer. */
  notes: string;
}

/** 
 * Request untuk Daftar Harga
 * @description https://developer.digiflazz.com/api/buyer/daftar-harga/#deskripsi
 */
export interface DaftarHargaRequest {
  cmd?: 'prepaid' | 'pasca';
  code?: string;
  category?: string;
  brand?: string;
  type?: string;
}
/**
 * Response Daftar Harga Produk
 * @description https://developer.digiflazz.com/api/buyer/daftar-harga/#deskripsi_1
 */
export interface HargaProduk {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
  // Fields untuk pascabayar
  admin?: number;
  commission?: number;
}

/**
 * Tipe untuk Transaksi (Top Up, Inquiry, Bayar)
 * @docs https://developer.digiflazz.com/api/buyer/topup/#request
 */
export interface BaseTransaksiRequest {
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
  testing?: boolean;
  max_price?: number;
  cb_url?: string;
  allow_dot?: boolean;
}
/**
 * Base Response untuk Transaksi (Top Up, Inquiry, Bayar)
 * @docs https://developer.digiflazz.com/api/buyer/topup/#response
 */
export interface TransaksiResponse {
  ref_id: string;
  status: 'Sukses' | 'Gagal' | 'Pending';
  rc: ResponseCode;
  message: string;
  buyer_sku_code: string;
  customer_no: string;
  sn: string;
  price: number;
  buyer_last_saldo: number;
  tele?: string;
  wa?: string;
}

// Tipe spesifik untuk Inquiry Pascabayar
export interface InquiryPascaResponse extends TransaksiResponse {
  customer_name: string;
  admin: number;
  selling_price: number;
  desc: Record<string, any> & {
    detail?: Array<Record<string, any>>;
  };
}

// Tipe spesifik untuk Bayar Pascabayar
export interface BayarPascaResponse extends InquiryPascaResponse {}

// Tipe spesifik untuk Cek Status
export interface CekStatusRequest {
    buyer_sku_code: string;
    customer_no: string;
    ref_id: string;
}

// --- Tipe untuk Inquiry PLN ---

/**
 * Parameter untuk request Cek ID Pelanggan PLN.
 */
export interface InquiryPlnRequest {
  /** ID Pelanggan PLN yang akan divalidasi. */
  customer_no: string;
}

/**
 * Response dari request Cek ID Pelanggan PLN yang sukses.
 */
export interface InquiryPlnResponse {
  message: string;
  status: 'Sukses' | 'Gagal';
  rc: ResponseCode;
  customer_no: string;
  meter_no?: string;
  subscriber_id?: string;
  name?: string;
  segment_power?: string;
}


// --- Tipe untuk Webhooks ---

/**
 * Enum untuk event yang dikirim oleh webhook Digiflazz.
 */
export enum WebhookEvent {
  Create = 'create',
  Update = 'update',
  Ping = 'ping',
}

/**
 * Payload yang dikirim untuk event 'create' dan 'update'.
 * Strukturnya identik dengan TransaksiResponse.
 */
export type WebhookTransactionPayload = TransaksiResponse;

/**
 * Payload yang dikirim untuk event 'ping' saat setup webhook.
 */
export interface PingEventPayload {
  sed: string;
  hook_id: string;
  hook: {
    url: string;
    secret: string;
    type: string;
    status: number;
  };
}

/**
 * Opsi untuk fungsi verifikasi webhook.
 */
export interface WebhookHandlerOptions {
  /**
   * Raw body dari request POST. PENTING: harus dalam bentuk string atau buffer,
   * bukan JSON yang sudah diparsing.
   */
  rawBody: string | Buffer;
  /**
   * Objek headers dari request, biasanya dari `req.headers` di Express.
   */
  headers: Record<string, string | string[] | undefined>;
  /**
   * Secret key yang Anda atur di dashboard Digiflazz untuk webhook ini.
   */
  secret: string;
}

/**
 * Hasil dari verifikasi webhook yang sukses.
 */
export interface VerifiedWebhookPayload<T> {
  /** Event yang teridentifikasi dari header X-Digiflazz-Event */
  event: WebhookEvent;
  /** Payload yang sudah diparsing dan divalidasi */
  payload: T;
}