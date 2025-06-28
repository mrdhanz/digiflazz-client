# digiflazz-node

![NPM Version](https://img.shields.io/npm/v/digiflazz-node)![License](https://img.shields.io/npm/l/digiflazz-node)![Downloads](https://img.shields.io/npm/dm/digiflazz-node)![Built with TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)

SDK Klien NodeJS tidak resmi (*unofficial*) yang modern, ringan, dan *type-safe* untuk berinteraksi dengan [API Buyer Digiflazz](https://developer.digiflazz.com/api/buyer).

**Disclaimer:** Perpustakaan ini dikembangkan secara independen dan tidak berafiliasi, didukung, atau secara resmi terhubung dengan Digiflazz.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Instalasi](#instalasi)
- [Penggunaan Dasar](#penggunaan-dasar)
- [Dokumentasi API](#dokumentasi-api)
  - [`cekSaldo()`](#ceksaldo)
  - [`daftarHarga(params)`](#daftarhargaparams)
  - [`requestDeposit(params)`](#requestdepositparams)
  - [`topUp(params)`](#topupparams)
  - [`inquiryPasca(params)`](#inquirypascaparams)
  - [`inquiryPln(params)`](#inquiryplnparams)
  - [`bayarPasca(params)`](#bayarpascaparams)
  - [`cekStatus(params)`](#cekstatusparams)
- [Penanganan Error](#penanganan-error)
- [Tipe dan Enum](#tipe-dan-enum)
- [Penanganan Webhook](#penanganan-webhook)
- [Lisensi](#lisensi)

## Fitur Utama

- ✅ **Modern & Asynchronous**: Dibangun dengan `async/await` untuk kode yang bersih dan mudah dibaca.
- 🛡️ **Type-Safe**: Sepenuhnya ditulis dalam TypeScript, dengan tipe yang diekspor untuk semua *request* dan *response*.
- 📦 **Ringan**: Hanya memiliki `axios` sebagai dependensi.
- 🌐 **Cakupan Penuh**: Mendukung semua *endpoint* yang tersedia di dokumentasi API Buyer Digiflazz.
- 🚨 **Penanganan Error Jelas**: Menyediakan *custom error class* (`DigiflazzApiError`) dengan `ResponseCode` enum untuk penanganan error yang spesifik.
- 🇮🇩 **Berbahasa Indonesia**: Dirancang dengan nama metode dan dokumentasi yang mudah dipahami oleh developer Indonesia.

## Instalasi

Gunakan manajer paket favorit Anda untuk menginstal.

```bash
# Menggunakan npm
npm install digiflazz-node

# Menggunakan yarn
yarn add digiflazz-node

# Menggunakan pnpm
pnpm add digiflazz-node
```

## Penggunaan Dasar

Impor `DigiflazzClient` dan inisialisasi dengan `username` dan `production key` Anda.

```typescript
import { DigiflazzClient, DigiflazzApiError } from 'digiflazz-node';
import { randomUUID } from 'crypto'; // Diperlukan untuk membuat ref_id unik

// Ganti dengan kredensial Anda dari dashboard Digiflazz
const USERNAME = 'USERNAME_ANDA';
const API_KEY = 'PRODUCTION_KEY_ANDA';

const client = new DigiflazzClient(USERNAME, API_KEY);

async function jalankanContoh() {
  try {
    // 1. Cek Saldo Anda
    const saldoInfo = await client.cekSaldo();
    console.log(`Saldo Anda saat ini: Rp ${saldoInfo.deposit.toLocaleString('id-ID')}`);

    // 2. Lakukan transaksi (gunakan testing: true agar tidak memotong saldo)
    const refId = randomUUID(); // Selalu gunakan ref_id yang unik untuk setiap transaksi
    const hasilTopUp = await client.topUp({
      buyer_sku_code: 'xld10', // Ganti dengan SKU produk yang valid
      customer_no: '087800001234',
      ref_id: refId,
      testing: true, 
    });

    console.log('Hasil Transaksi:', hasilTopUp);

  } catch (error) {
    if (error instanceof DigiflazzApiError) {
      // Tangani error spesifik dari API Digiflazz
      console.error('Terjadi kesalahan API Digiflazz:');
      console.error(`  Pesan: ${error.message}`);
      console.error(`  Kode Respon (rc): ${error.rc}`);
      console.error(`  Data Lengkap:`, error.responseData);
    } else {
      // Tangani error lain (misal: masalah jaringan)
      console.error('Terjadi kesalahan tidak terduga:', error);
    }
  }
}

jalankanContoh();
```

## Dokumentasi API

Semua metode mengembalikan sebuah `Promise`.

### `cekSaldo()`

Mengecek sisa saldo deposit Anda.

- **Returns**: `Promise<CekSaldoResponse>`

```typescript
const saldo = await client.cekSaldo();
// saldo -> { deposit: 1000000 }
```

### `daftarHarga(params)`

Mendapatkan daftar harga produk prabayar atau pascabayar.

- **Parameters**: `DaftarHargaRequest` (opsional)
  - `cmd`: `'prepaid'` (default) atau `'pasca'`.
- **Returns**: `Promise<HargaProduk[]>`

```typescript
// Mendapatkan semua produk prabayar
const semuaProduk = await client.daftarHarga();

// Mendapatkan semua produk pascabayar
const produkPasca = await client.daftarHarga({ cmd: 'pasca' });

console.log('Contoh Produk:', semuaProduk[0]);
```

### `requestDeposit(params)`

Membuat tiket untuk permintaan deposit. API akan merespons dengan jumlah yang harus ditransfer (sudah termasuk kode unik) dan berita transfer.

- **Parameters**: `DepositRequest`
  - `amount`: `number` (Jumlah yang diinginkan)
  - `Bank`: `'BCA' | 'MANDIRI' | 'BRI' | 'BNI'`
  - `owner_name`: `string` (Nama pemilik rekening)
- **Returns**: `Promise<DepositResponse>`

```typescript
try {
  const tiketDeposit = await client.requestDeposit({
    amount: 50000,
    Bank: 'BCA',
    owner_name: 'Budi Santoso',
  });

  console.log(`Silakan transfer sejumlah: Rp ${tiketDeposit.amount.toLocaleString('id-ID')}`);
  console.log(`Dengan berita transfer: ${tiketDeposit.notes}`);
} catch (error) {
  console.error('Gagal membuat tiket deposit:', error);
}
```

### `topUp(params)`

Melakukan pembelian produk prabayar.

- **Parameters**: `BaseTransaksiRequest`
  - `buyer_sku_code`: `string`
  - `customer_no`: `string`
  - `ref_id`: `string` (ID transaksi unik dari sisi Anda)
  - `testing?`: `boolean` (opsional, set `true` untuk mode tes)
  - `...opsi lainnya`
- **Returns**: `Promise<TransaksiResponse>`

```typescript
const hasil = await client.topUp({
  buyer_sku_code: 'xld25',
  customer_no: '087800001234',
  ref_id: 'trx-unik-12345',
});
```

### `inquiryPasca(params)`

Mengecek tagihan produk pascabayar sebelum melakukan pembayaran.

- **Parameters**: `BaseTransaksiRequest`
- **Returns**: `Promise<InquiryPascaResponse>`

```typescript
const tagihanPln = await client.inquiryPasca({
  buyer_sku_code: 'pln',
  customer_no: '530000000003',
  ref_id: 'inq-pln-67890',
});

console.log(`Nama Pelanggan: ${tagihanPln.customer_name}`);
console.log(`Total Tagihan: ${tagihanPln.selling_price}`);
```

### `inquiryPln(params)`

Memvalidasi Nomor ID Pelanggan PLN dan mendapatkan detail pelanggan sebelum melakukan transaksi token listrik.

- **Parameters**: `InquiryPlnRequest`
  - `customer_no`: `string` (ID Pelanggan PLN)
- **Returns**: `Promise<InquiryPlnResponse>`

```typescript
try {
  const detailPln = await client.inquiryPln({
    customer_no: '523300817840', // Ganti dengan ID PLN yang valid
  });

  if (detailPln.rc === '00') {
    console.log(`Validasi Sukses untuk: ${detailPln.name}`);
    console.log(`Daya: ${detailPln.segment_power}`);
  }
} catch (error) {
  // Tangani jika ID tidak ditemukan atau error lainnya
  console.error(error);
}
```

### `bayarPasca(params)`

Melakukan pembayaran tagihan pascabayar setelah *inquiry*.

**Penting**: Gunakan `ref_id` yang sama persis dengan yang digunakan saat `inquiryPasca`.

- **Parameters**: `BaseTransaksiRequest`
- **Returns**: `Promise<BayarPascaResponse>`

```typescript
const hasilBayar = await client.bayarPasca({
  buyer_sku_code: 'pln',
  customer_no: '530000000003',
  ref_id: 'inq-pln-67890', // <-- ref_id yang sama dengan inquiry
});

console.log(`Status Pembayaran: ${hasilBayar.message}`);
```

### `cekStatus(params)`

Mengecek status sebuah transaksi yang sudah ada.

- **Parameters**: `CekStatusRequest`
  - `buyer_sku_code`: `string`
  - `customer_no`: `string`
  - `ref_id`: `string`
- **Returns**: `Promise<TransaksiResponse>`

```typescript
const status = await client.cekStatus({
  buyer_sku_code: 'xld25',
  customer_no: '087800001234',
  ref_id: 'trx-unik-12345',
});

console.log(`Status transaksi terakhir: ${status.status} - ${status.message}`);
```

## Penanganan Error

Library ini akan melempar `DigiflazzApiError` jika API mengembalikan respons dengan status selain "Sukses" (`rc` bukan `'00'`). Anda bisa menangkap error ini dan mengakses properti-propertinya untuk *logic* yang lebih detail.

Properti `DigiflazzApiError`:
- `message`: Pesan error dari API.
- `rc`: `ResponseCode` enum (contoh: `ResponseCode.SaldoTidakCukup`).
- `status`: Status transaksi (`'Gagal'`, `'Pending'`).
- `responseData`: Objek respons lengkap dari API.

```typescript
import { DigiflazzClient, DigiflazzApiError, ResponseCode } from 'digiflazz-node';

const client = new DigiflazzClient('user', 'key');

try {
  await client.topUp({
    buyer_sku_code: 'invalid-sku',
    customer_no: '08123',
    ref_id: 'test-error-1',
  });
} catch (error) {
  if (error instanceof DigiflazzApiError) {
    console.error(`Pesan: ${error.message}`);
    console.error(`Kode: ${error.rc}`);
    
    // Contoh logic berdasarkan response code
    if (error.rc === ResponseCode.SaldoTidakCukup) {
      console.log('Mohon isi ulang saldo Anda untuk melanjutkan transaksi.');
    } else if (error.rc === ResponseCode.SkuNotFound) {
      console.log('SKU produk tidak ditemukan atau tidak aktif.');
    }
  }
}
```

## Tipe dan Enum

Untuk pengalaman pengembangan terbaik dengan TypeScript, semua tipe *request*, *response*, dan `enum` `ResponseCode` diekspor dari library.

```typescript
import {
  DigiflazzClient,
  ResponseCode,
  HargaProduk,
  TransaksiResponse
} from 'digiflazz-node';

function cetakInfoProduk(produk: HargaProduk) {
  // ...
}

function prosesTransaksi(hasil: TransaksiResponse) {
  if (hasil.rc === ResponseCode.Sukses) {
    // ...
  }
}
```

## Penanganan Webhook

Library ini menyediakan fungsi bantuan untuk menerima dan memverifikasi *webhook* dari Digiflazz dengan aman.

### 1. Verifikasi Signature & Parsing Payload

Gunakan fungsi `verifyAndParseWebhook` untuk memastikan *request* yang masuk benar-benar berasal dari Digiflazz.

**Penting:** Anda memerlukan *middleware* untuk mendapatkan *raw body* dari *request*. Contoh di bawah menggunakan `express.raw()`.

**Contoh Implementasi dengan Express.js:**

```typescript
import express from 'express';
import { verifyAndParseWebhook, DigiflazzWebhookError, WebhookEvent } from 'digiflazz-node';

const app = express();

// Secret key dari pengaturan webhook di dashboard Digiflazz Anda
const WEBHOOK_SECRET = 'SECRET_KEY_ANDA';

// Endpoint untuk menerima webhook dari Digiflazz
// Gunakan express.raw() agar kita mendapatkan body sebagai buffer/string
app.post(
  '/webhook-handler',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    try {
      const { event, payload } = verifyAndParseWebhook({
        rawBody: req.body,
        headers: req.headers,
        secret: WEBHOOK_SECRET,
      });

      console.log(`Webhook terverifikasi! Event: ${event}`);
      
      // Lakukan sesuatu berdasarkan event
      switch (event) {
        case WebhookEvent.Create:
        case WebhookEvent.Update:
          // 'payload' di sini adalah tipe WebhookTransactionPayload
          console.log(`Transaksi ${payload.ref_id} statusnya menjadi: ${payload.status}`);
          // Contoh: Update status transaksi di database Anda
          break;
        case WebhookEvent.Ping:
          // 'payload' di sini adalah tipe PingEventPayload
          console.log(`Ping event diterima untuk hook ID: ${payload.hook_id}`);
          break;
      }

      res.status(200).send('Webhook diterima');
    } catch (error) {
      if (error instanceof DigiflazzWebhookError) {
        console.error('Error verifikasi webhook:', error.message);
        res.status(400).send(error.message);
      } else {
        console.error('Error tidak terduga:', error);
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

app.listen(3000, () => {
  console.log('Server berjalan di port 3000');
});
```

### 2. Memicu Event Ping

Anda dapat secara manual memicu *ping event* untuk menguji konektivitas webhook Anda menggunakan metode `triggerPing`.

- **Parameters**: `webhookId: string`
- **Returns**: `Promise<PingEventPayload>`

```typescript
import { DigiflazzClient } from 'digiflazz-node';

const client = new DigiflazzClient('USERNAME_ANDA', 'API_KEY_ANDA');
const WEBHOOK_ID = 'ID_WEBHOOK_ANDA'; // Dapat dilihat di dashboard

async function testPing() {
  try {
    const pingResult = await client.triggerPing(WEBHOOK_ID);
    console.log('Ping event berhasil dikirim!');
    console.log('Detail Hook:', pingResult.hook);
  } catch (error) {
    console.error('Gagal mengirim ping:', error);
  }
}

testPing();
```

## Lisensi

Dilisensikan di bawah [Lisensi MIT](LICENSE)