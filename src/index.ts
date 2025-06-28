import axios, { AxiosInstance } from "axios";
import { generateSign } from "./utils";
import {
  DigiflazzBaseResponse,
  ResponseCode,
  CekSaldoResponse,
  DaftarHargaRequest,
  HargaProduk,
  BaseTransaksiRequest,
  TransaksiResponse,
  InquiryPascaResponse,
  BayarPascaResponse,
  CekStatusRequest,
  PingEventPayload,
  InquiryPlnRequest,
  InquiryPlnResponse,
  DepositRequest,
  DepositResponse,
} from "./types";
import { DigiflazzApiError } from "./errors";

const API_BASE_URL_PRODUCTION = "https://api.digiflazz.com/v1";

export class DigiflazzClient {
  private readonly username: string;
  private readonly apiKey: string;
  private readonly client: AxiosInstance;

  /**
   * Membuat instance baru dari DigiflazzClient.
   * @param username - Username Digiflazz Anda.
   * @param apiKey - Production Key (API Key) Anda.
   * @docs https://developer.digiflazz.com/api/buyer/persiapan/
   */
  constructor(username: string, apiKey: string) {
    if (!username || !apiKey) {
      throw new Error("Username dan API Key wajib diisi.");
    }
    this.username = username;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: API_BASE_URL_PRODUCTION,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Metode privat untuk menangani semua request ke API Digiflazz.
   * Secara otomatis akan membuat signature, mengirim request, dan menangani response.
   * @param endpoint - Path endpoint API, contoh: '/cek-saldo'.
   * @param body - Body dari request.
   * @param signIdentifier - String yang digunakan untuk membuat signature ('depo', 'pricelist', atau ref_id).
   */
  private async _request<T>(
    endpoint: string,
    body: Record<string, any>,
    signIdentifier: string
  ): Promise<T> {
    const requestBody = {
      ...body,
      username: this.username,
      sign: generateSign(this.username, this.apiKey, signIdentifier),
    };

    try {
      const response = await this.client.post<DigiflazzBaseResponse<any>>(
        endpoint,
        requestBody
      );
      const responseData = response.data.data;

      // Periksa response code. Jika bukan sukses ('00'), lempar error khusus.
      if (responseData.rc && responseData.rc !== ResponseCode.Sukses) {
        throw new DigiflazzApiError(responseData);
      }

      return responseData;
    } catch (error) {
      if (error instanceof DigiflazzApiError) {
        throw error; // Lempar kembali error yang sudah kita tangani
      }
      if (axios.isAxiosError(error)) {
        // Handle error jaringan atau HTTP status code error
        throw new Error(`Kesalahan jaringan atau server: ${error.message}`);
      }
      // Untuk error tak terduga lainnya
      throw error;
    }
  }

  /**
   * Mengecek sisa saldo deposit.
   * @returns Promise yang resolve dengan informasi saldo.
   * @docs https://developer.digiflazz.com/api/buyer/cek-saldo/
   */
  async cekSaldo(): Promise<CekSaldoResponse> {
    return this._request<CekSaldoResponse>(
      "/cek-saldo",
      { cmd: "deposit" },
      "depo"
    );
  }

  /**
   * Membuat tiket untuk permintaan deposit.
   * Anda akan mendapatkan jumlah unik dan berita transfer yang harus digunakan.
   * @param params - Detail permintaan deposit: jumlah, bank, dan nama pemilik rekening.
   * @returns Promise yang resolve dengan detail tiket deposit.
   */
  async requestDeposit(params: DepositRequest): Promise<DepositResponse> {
    // Validasi input dasar
    if (!params.amount || params.amount <= 0) {
      throw new Error("Jumlah deposit harus lebih besar dari 0.");
    }
    if (!params.Bank || !params.owner_name) {
      throw new Error('Parameter "Bank" dan "owner_name" wajib diisi.');
    }

    // Sesuai dokumentasi, signature untuk deposit adalah md5(username + key + "deposit")
    const signIdentifier = "deposit";

    return this._request<DepositResponse>("/deposit", params, signIdentifier);
  }

  /**
   * Mendapatkan daftar harga produk.
   * @param params - Parameter opsional untuk memfilter daftar harga.
   * @returns Promise yang resolve dengan array produk.
   * @docs https://developer.digiflazz.com/api/buyer/daftar-harga/
   */
  async daftarHarga(
    params: DaftarHargaRequest = { cmd: "prepaid" }
  ): Promise<HargaProduk[]> {
    return this._request<HargaProduk[]>("/price-list", params, "pricelist");
  }

  /**
   * Melakukan pembelian produk prabayar (top up).
   * @param params - Detail transaksi yang akan dilakukan.
   * @returns Promise yang resolve dengan hasil transaksi.
   * @docs https://developer.digiflazz.com/api/buyer/topup/
   */
  async topUp(params: BaseTransaksiRequest): Promise<TransaksiResponse> {
    return this._request<TransaksiResponse>(
      "/transaction",
      params,
      params.ref_id
    );
  }

  /**
   * Melakukan inquiry (cek tagihan) untuk produk pascabayar.
   * @param params - Detail inquiry yang akan dilakukan.
   * @returns Promise yang resolve dengan detail tagihan.
   * @docs https://developer.digiflazz.com/api/buyer/cek-tagihan/
   */
  async inquiryPasca(
    params: BaseTransaksiRequest
  ): Promise<InquiryPascaResponse> {
    const body = {
      ...params,
      commands: "inq-pasca",
    };
    return this._request<InquiryPascaResponse>(
      "/transaction",
      body,
      params.ref_id
    );
  }

  /**
   * Memvalidasi Nomor ID Pelanggan PLN dan mendapatkan detail pelanggan.
   * Endpoint ini memiliki signature khusus: md5(username + apiKey + customer_no).
   * @param params - Objek yang berisi nomor pelanggan PLN.
   * @returns Promise yang resolve dengan detail informasi pelanggan PLN.
   * @docs https://developer.digiflazz.com/api/buyer/inquiry-pln/
   */
  async inquiryPln(params: InquiryPlnRequest): Promise<InquiryPlnResponse> {
    const { customer_no } = params;

    if (!customer_no) {
      throw new Error('Parameter "customer_no" wajib diisi untuk inquiry PLN.');
    }

    // Sesuai dokumentasi, signature untuk endpoint ini menggunakan `customer_no`
    const signIdentifier = customer_no;

    const body = {
      customer_no,
    };

    return this._request<InquiryPlnResponse>(
      "/inquiry-pln",
      body,
      signIdentifier
    );
  }

  /**
   * Melakukan pembayaran tagihan pascabayar.
   * Pastikan untuk menggunakan `ref_id` yang sama dengan saat inquiry.
   * @param params - Detail pembayaran yang akan dilakukan.
   * @returns Promise yang resolve dengan hasil pembayaran.
   * @docs https://developer.digiflazz.com/api/buyer/bayar-tagihan/
   */
  async bayarPasca(params: BaseTransaksiRequest): Promise<BayarPascaResponse> {
    const body = {
      ...params,
      commands: "pay-pasca",
    };
    return this._request<BayarPascaResponse>(
      "/transaction",
      body,
      params.ref_id
    );
  }

  /**
   * Mengecek status transaksi yang sudah ada.
   * @param params - Detail transaksi yang ingin dicek.
   * @returns Promise yang resolve dengan status transaksi terkini.
   * @docs https://developer.digiflazz.com/api/buyer/cek-status/
   */
  async cekStatus(params: CekStatusRequest): Promise<TransaksiResponse> {
    const body = {
      ...params,
      commands: "status-pasca",
    };
    return this._request<TransaksiResponse>(
      "/transaction",
      body,
      params.ref_id
    );
  }

  /**
   * Memicu 'ping' event ke webhook yang terdaftar untuk testing.
   * @param webhookId - ID dari webhook yang bisa Anda dapatkan dari dashboard Digiflazz.
   * @returns Promise yang resolve dengan detail ping event.
   * @docs https://developer.digiflazz.com/api/buyer/webhook/#ping-endpoint
   */
  async triggerPing(webhookId: string): Promise<PingEventPayload> {
    if (!webhookId) {
      throw new Error("Webhook ID wajib diisi.");
    }
    const endpoint = `/report/hooks/${webhookId}/pings`;
    try {
      // Endpoint ini tidak memerlukan signature standar, cukup POST request.
      const response = await this.client.post<PingEventPayload>(endpoint);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Gagal memicu ping event: ${
            error.response?.statusText || error.message
          }`
        );
      }
      throw error;
    }
  }
}

// Ekspor juga tipe dan error agar bisa digunakan oleh pengguna library
export * from "./types";
export * from "./errors";
export * from "./webhooks";
