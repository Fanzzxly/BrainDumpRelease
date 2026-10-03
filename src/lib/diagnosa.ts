/**
 * Menerjemahkan kegagalan koneksi/query Supabase jadi penjelasan yang bisa
 * ditindaklanjuti. Tanpa ini, konfigurasi yang belum beres cuma tampil
 * sebagai layar error kosong dan sulit ditebak sebabnya.
 */

export type Diagnosa = {
  judul: string;
  sebab: string;
  langkah: string[];
  teknis?: string;
};

function pesanDari(e: unknown): string {
  if (!e) return "";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    return [o.message, o.details, o.hint].filter(Boolean).join(" · ");
  }
  return String(e);
}

function kodeDari(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.code === "string") return o.code;
  }
  return "";
}

export function diagnosa(e: unknown): Diagnosa {
  const pesan = pesanDari(e);
  const kode = kodeDari(e);
  const p = pesan.toLowerCase();

  // Environment variable belum diisi sama sekali (dilempar oleh src/lib/env.ts).
  if (p.includes("belum diisi")) {
    return {
      judul: "Environment variable belum lengkap",
      sebab: pesan,
      langkah: [
        "Buka Vercel → Settings → Environments → Environment Variables.",
        "Pastikan semua variable di .env.example sudah terisi.",
        "Centang Production (dan Preview) saat menambahkannya.",
        "Deployments → deployment teratas → ⋯ → Redeploy.",
      ],
    };
  }

  // PGRST125: path ke PostgREST rusak, hampir selalu karena SUPABASE_URL
  // berakhir dengan garis miring sehingga jadi dobel slash.
  if (kode === "PGRST125" || p.includes("invalid path specified")) {
    return {
      judul: "SUPABASE_URL salah bentuk",
      sebab:
        "Database terhubung, tapi alamat yang dipanggil rusak. Biasanya karena SUPABASE_URL berakhir dengan garis miring.",
      langkah: [
        "Buka Vercel → Settings → Environments → Environment Variables.",
        "Hapus garis miring di akhir SUPABASE_URL, juga spasi yang tidak sengaja ikut.",
        "Bentuk yang benar: https://xxxx.supabase.co",
        "Redeploy setelah diperbaiki.",
      ],
      teknis: pesan,
    };
  }

  // 42P01 = undefined_table. Muncul kalau schema.sql belum dijalankan.
  if (kode === "42P01" || p.includes("does not exist") || p.includes("schema cache")) {
    return {
      judul: "Tabel database belum dibuat",
      sebab: "Database terhubung, tapi tabel dan view yang dibutuhkan belum ada.",
      langkah: [
        "Buka Supabase → project kamu → SQL Editor → New query.",
        "Tempel seluruh isi supabase/schema.sql dari repo ini.",
        "Klik Run. Aman dijalankan ulang kalau ragu.",
        "Muat ulang halaman ini.",
      ],
      teknis: pesan,
    };
  }

  // Key salah atau tertukar dengan publishable key.
  if (
    p.includes("invalid api key") ||
    p.includes("invalid jwt") ||
    p.includes("jwt") ||
    p.includes("unauthorized") ||
    kode === "401" ||
    kode === "PGRST301"
  ) {
    return {
      judul: "Key Supabase ditolak",
      sebab: "SUPABASE_SERVICE_ROLE_KEY salah, atau terisi Publishable key.",
      langkah: [
        "Buka Supabase → Project Settings → API Keys.",
        "Ambil Secret key (berawalan sb_secret_), bukan Publishable key.",
        "Perbarui SUPABASE_SERVICE_ROLE_KEY di Vercel.",
        "Redeploy supaya nilai barunya terpakai.",
      ],
      teknis: pesan,
    };
  }

  // RLS memblokir: tanda khas publishable key yang lolos autentikasi.
  if (kode.startsWith("42501") || p.includes("row-level security") || p.includes("permission denied")) {
    return {
      judul: "Akses ditolak oleh RLS",
      sebab:
        "Key yang dipakai tunduk pada Row Level Security. Aplikasi ini butuh Secret key yang melewatinya.",
      langkah: [
        "Pastikan SUPABASE_SERVICE_ROLE_KEY berisi Secret key (sb_secret_...).",
        "Publishable key / anon tidak akan pernah bisa membaca tabel ini.",
        "Perbarui di Vercel, lalu Redeploy.",
      ],
      teknis: pesan,
    };
  }

  // URL salah ketik, project dihapus, atau project di-pause.
  if (
    p.includes("fetch failed") ||
    p.includes("enotfound") ||
    p.includes("econnrefused") ||
    p.includes("getaddrinfo") ||
    p.includes("timeout")
  ) {
    return {
      judul: "Database tidak bisa dihubungi",
      sebab: "SUPABASE_URL salah, atau project Supabase sedang di-pause.",
      langkah: [
        "Cek SUPABASE_URL di Vercel — bentuknya https://xxxx.supabase.co, tanpa garis miring di akhir.",
        "Pastikan nilainya bukan lagi placeholder.",
        "Buka dashboard Supabase; kalau project berstatus paused, klik Restore.",
        "Redeploy setelah diperbaiki.",
      ],
      teknis: pesan,
    };
  }

  return {
    judul: "Gagal memuat data",
    sebab: "Ada gangguan saat menghubungi database.",
    langkah: [
      "Coba muat ulang halaman.",
      "Cek Vercel → Logs untuk pesan lengkapnya.",
      "Pastikan schema.sql sudah dijalankan dan semua env var terisi.",
    ],
    teknis: pesan || String(e),
  };
}
