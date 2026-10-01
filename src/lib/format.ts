export const GRADES = ["A", "AB", "B", "C"] as const;
export type Grade = (typeof GRADES)[number];

const TZ = "Asia/Jakarta";

/** Tanggal hari ini di zona WIB, format YYYY-MM-DD. */
export function hariIni(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Geser tanggal YYYY-MM-DD sebanyak n hari (boleh negatif). */
export function geserHari(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function rupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
}

export function angka(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

/** "16 Sep 2026" */
export function tanggalPendek(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

/** "Senin, 16 September 2026" */
export function tanggalPanjang(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00+07:00`));
}

export function salam(): string {
  const jam = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 19) return "Selamat sore";
  return "Selamat malam";
}

export function normalisasiGrade(raw: string): Grade | null {
  const g = raw.trim().toUpperCase();
  return (GRADES as readonly string[]).includes(g) ? (g as Grade) : null;
}
