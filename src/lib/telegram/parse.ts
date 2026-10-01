import { normalisasiGrade, type Grade } from "../format";

export type Penugasan = {
  kunci: string;          // sudah huruf besar, mis. "A", "AB"
  jumlah: number;
  harga?: number;         // diisi kalau token memakai "@"
};

export type Terurai = {
  penugasan: Penugasan[];
  sisaTeks: string;       // token yang bukan penugasan, digabung kembali
  teksMentah: string;     // argumen apa adanya, hanya token tanggal yang dibuang
  tanggal?: string;       // dari token tgl=YYYY-MM-DD
};

const RE_PENUGASAN = /^([A-Za-z]{1,3})\s*=\s*(\d+)(?:\s*@\s*([\d.,]+[a-z]*))?$/;

/** Grade telur, atau ID kandang satu huruf. */
function kunciMasukAkal(token: string): boolean {
  const k = token.toUpperCase();
  return /^(A|AB|B|C)$/.test(k) || /^[A-Z]$/.test(k);
}
const RE_TANGGAL = /^(?:tgl|tanggal)\s*=\s*(\d{4}-\d{2}-\d{2})$/i;

/**
 * Angka gaya Indonesia: "150.000", "150rb", "1,5jt", "2000".
 * Titik dianggap pemisah ribuan, koma pemisah desimal.
 */
export function parseAngka(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(rp)?([\d.,]+)(rb|ribu|k|jt|juta)?$/);
  if (!m) return null;
  const pengali = m[3]
    ? ["rb", "ribu", "k"].includes(m[3])
      ? 1_000
      : 1_000_000
    : 1;
  const angka = Number(m[2].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(angka)) return null;
  return angka * pengali;
}

/**
 * Pecah argumen perintah menjadi penugasan ("A=20@2000") dan teks bebas.
 * Bentuk "A 20" juga diterima supaya tidak rewel soal tanda sama dengan.
 */
export function urai(argumen: string): Terurai {
  // Pisahkan dengan "|" kalau ada: kiri teks bebas, kanan penugasan.
  let teksKiri = "";
  let sisa = argumen;
  const pipa = argumen.indexOf("|");
  if (pipa !== -1) {
    teksKiri = argumen.slice(0, pipa).trim();
    sisa = argumen.slice(pipa + 1);
  }

  const token = sisa.trim().split(/\s+/).filter(Boolean);
  const penugasan: Penugasan[] = [];
  const lain: string[] = [];
  let tanggal: string | undefined;

  for (let i = 0; i < token.length; i++) {
    const t = token[i];

    const tgl = t.match(RE_TANGGAL);
    if (tgl) {
      tanggal = tgl[1];
      continue;
    }

    const m = t.match(RE_PENUGASAN);
    if (m) {
      const harga = m[3] ? parseAngka(m[3]) : undefined;
      penugasan.push({
        kunci: m[1].toUpperCase(),
        jumlah: Number(m[2]),
        harga: harga ?? undefined,
      });
      continue;
    }

    // Bentuk "A 20": hanya untuk kunci yang memang bisa jadi grade telur
    // atau ID kandang. Tanpa batasan ini, "/keluar 50rb gas 2 tabung" akan
    // membaca "gas 2" sebagai penugasan dan merusak keterangannya.
    if (
      kunciMasukAkal(t) &&
      i + 1 < token.length &&
      /^\d+$/.test(token[i + 1])
    ) {
      penugasan.push({ kunci: t.toUpperCase(), jumlah: Number(token[i + 1]) });
      i++;
      continue;
    }

    lain.push(t);
  }

  const sisaTeks = [teksKiri, lain.join(" ")].filter(Boolean).join(" ").trim();
  const teksMentah = argumen
    .replace(/(?:^|\s)(?:tgl|tanggal)\s*=\s*\d{4}-\d{2}-\d{2}(?=\s|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { penugasan, sisaTeks, teksMentah, tanggal };
}

/** Saring penugasan yang kuncinya grade telur yang sah. */
export function hanyaGrade(penugasan: Penugasan[]): { grade: Grade; jumlah: number; harga?: number }[] {
  const out: { grade: Grade; jumlah: number; harga?: number }[] = [];
  for (const p of penugasan) {
    const g = normalisasiGrade(p.kunci);
    if (g) out.push({ grade: g, jumlah: p.jumlah, harga: p.harga });
  }
  return out;
}

/**
 * Nomor urut di awal teks, mis. "/batal 3" -> 3. Dipakai perintah yang
 * menunjuk baris di daftar /riwayat. Tanda "#" di depan ikut diterima.
 */
export function nomorDari(teks: string): number | null {
  const m = teks.trim().match(/^#?(\d{1,3})(?:\s|$)/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

/** Pisahkan "/perintah argumen" menjadi dua bagian. */
export function pecahPerintah(teks: string): { perintah: string; argumen: string } {
  const bersih = teks.trim();
  if (!bersih.startsWith("/")) return { perintah: "", argumen: bersih };
  const spasi = bersih.search(/\s/);
  const kepala = spasi === -1 ? bersih : bersih.slice(0, spasi);
  const argumen = spasi === -1 ? "" : bersih.slice(spasi + 1).trim();
  // Buang "@namabot" pada perintah di grup.
  const perintah = kepala.slice(1).split("@")[0].toLowerCase();
  return { perintah, argumen };
}
