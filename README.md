# Zenofarm

Jurnal usaha bebek petelur: dashboard web + input lewat bot Telegram.
Satu sumber data, dua cara mengisi.

- **Dashboard** — ringkasan, produksi harian, stok per grade, penjualan,
  pemakaian & afkir, pengeluaran, laporan periode, pengaturan kandang.
  Tiap riwayat punya tombol **hapus** untuk membetulkan salah catat.
- **Bot Telegram** — mencatat semuanya dari HP tanpa membuka browser.

Stack: Next.js (App Router) · Supabase (PostgreSQL) · Vercel.
Bot memakai **mode webhook**, jadi tidak perlu proses yang hidup 24 jam
dan tidak perlu VPS.

---

## Cara kerja data

```
                 ┌─────────────────┐
  Dashboard ───▶ │                 │
                 │  Supabase (DB)  │
  Bot Telegram ─▶│                 │
                 └─────────────────┘
```

Stok telur tidak disimpan sebagai angka, tapi dihitung:

```
stok grade X = hasil klasifikasi − terjual − terpakai
populasi     = populasi awal kandang − total afkir
```

Jadi angka stok tidak akan pernah menyimpang dari catatannya.

---

## Pasang

### 1. Database (Supabase)

1. Buat project baru di [supabase.com](https://supabase.com) (free tier cukup).
2. Buka **SQL Editor**, tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql), jalankan.
3. Catat dua nilai dari **Project Settings**:
   - *Data API* → **Project URL**
   - *API Keys* → **Secret key** (berawalan `sb_secret_`; pada project lama
     namanya `service_role`). Bukan *Publishable key* / `anon` — key itu
     tunduk pada RLS sehingga aplikasi akan kosong dan gagal menyimpan.

Baris terakhir `schema.sql` mengisi 3 kandang dengan total 200 ekor.
Sesuaikan angkanya, atau ubah nanti lewat halaman **Kandang**.

### 2. Bot Telegram

1. Chat [@BotFather](https://t.me/BotFather) → `/newbot` → simpan **token**-nya.
2. Cari **chat ID** kamu: chat [@userinfobot](https://t.me/userinfobot), dia membalas dengan ID-mu.
   (Kalau belum tahu, deploy saja dulu — bot akan memberitahu ID-mu saat kamu kirim pesan pertama.)

### 3. Deploy ke Vercel

Import repo ini di Vercel, lalu isi **Environment Variables**:

| Variable | Isi |
|---|---|
| `SUPABASE_URL` | Project URL dari langkah 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_…`) dari langkah 1 |
| `APP_PASSWORD` | password untuk masuk ke dashboard |
| `AUTH_SECRET` | string acak panjang (`openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | token dari BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | string acak buatanmu (`openssl rand -hex 16`) |
| `TELEGRAM_ALLOWED_CHAT_IDS` | chat ID kamu; pisahkan dengan koma kalau lebih dari satu |

### 4. Daftarkan webhook

Setelah deploy selesai, jalankan sekali (ganti tiga nilai di dalamnya):

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "content-type: application/json" \
  -d '{
    "url": "https://<domain-vercel-kamu>/api/telegram",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message"]
  }'
```

Balasan `{"ok":true}` berarti beres. Kirim `/mulai` ke botmu untuk mengecek.

Perlu mengulang langkah ini kalau domain berubah atau
`TELEGRAM_WEBHOOK_SECRET` diganti.

---

## Perintah bot

| Perintah | Contoh |
|---|---|
| Produksi per kandang | `/produksi A=50 B=45 C=45` |
| Klasifikasi grade | `/grade A=40 AB=50 B=30` |
| Penjualan | `/jual Pak Budi \| A=20@2000 AB=30@1700` |
| Pengeluaran | `/keluar 150rb pakan 2 karung` |
| Pemakaian telur | `/pakai AB=2 digoreng` |
| Afkir bebek | `/afkir A=1 sakit` |
| Lihat stok | `/stok` |
| Ringkasan usaha | `/ringkasan` |
| Catatan terakhir | `/riwayat` |
| Batalkan catatan | `/batal` · `/batal 3` |
| Daftar perintah | `/bantuan` |

Catatan:

- **Grade C otomatis.** `/grade A=40 AB=50 B=30` mengisi C dari sisa produksi
  hari itu. Mau tulis sendiri: tambahkan `C=20`.
- **Harga diisi tiap transaksi** dengan tanda `@`, tidak ada harga tetap.
- **Tanggal mundur**: tambahkan `tgl=2026-09-16` di perintah mana pun.
- **Nominal luwes**: `150000`, `150rb`, `1,5jt`, `Rp2000` semuanya terbaca.
- Penjualan dan pemakaian **ditolak kalau melebihi stok**, jadi stok tidak
  bisa jadi minus karena salah ketik.
- **Salah ketik bisa dibatalkan.** `/riwayat` menampilkan 10 catatan terakhir
  bernomor, `/batal` menghapus yang paling baru, `/batal 3` menghapus nomor 3.
  Urutannya mengikuti waktu pengetikan, jadi catatan bertanggal mundur tetap
  berada di nomor 1 kalau baru saja diketik.
- Klasifikasi tidak bisa dibatalkan kalau telurnya sudah terjual atau terpakai
  — penjualan/pemakaiannya harus dibatalkan dulu, supaya stok tidak jadi minus.

---

## Keamanan

- Dashboard dikunci password (`APP_PASSWORD`), sesi berupa cookie
  bertanda tangan HMAC yang berlaku 30 hari.
- Webhook memeriksa header `X-Telegram-Bot-Api-Secret-Token`, jadi orang lain
  tidak bisa mengirim data palsu ke endpoint-nya.
- Bot hanya melayani chat ID yang terdaftar di `TELEGRAM_ALLOWED_CHAT_IDS`.
  Orang lain yang menemukan botmu tidak bisa menulis apa pun.
- RLS menyala di semua tabel tanpa policy. Aplikasi memakai service_role key
  dari sisi server; anon key tidak bisa membaca apa pun.

`SUPABASE_SERVICE_ROLE_KEY` memberi akses penuh ke database. Simpan hanya
di environment variable Vercel, jangan pernah di-commit.

---

## Jalankan lokal

```bash
npm install
cp .env.example .env.local   # isi nilainya
npm run dev                  # http://localhost:3000
```

Perintah lain:

```bash
npm test         # uji parser perintah bot
npm run typecheck
npm run build
```

Bot tidak bisa diuji dari localhost karena Telegram butuh URL HTTPS publik.
Pakai tunnel (mis. `ngrok http 3000`) lalu arahkan `setWebhook` ke URL tunnel
itu kalau mau mencoba bot sebelum deploy.
