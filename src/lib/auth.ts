/**
 * Sesi login sederhana untuk satu pengguna: cookie berisi
 * "<waktu-terbit>.<tanda-tangan HMAC>". Dipakai juga oleh middleware,
 * jadi hanya memakai Web Crypto (tersedia di Edge maupun Node).
 */

export const COOKIE_SESI = "zf_sesi";
const UMUR_SESI_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function tandaTangan(pesan: string, rahasia: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(rahasia),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(pesan)));
}

/** Perbandingan waktu-tetap supaya tanda tangan tidak bisa ditebak bertahap. */
function samaPersis(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let beda = 0;
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return beda === 0;
}

export async function buatToken(rahasia: string): Promise<string> {
  const terbit = String(Date.now());
  return `${terbit}.${await tandaTangan(terbit, rahasia)}`;
}

export async function tokenSah(token: string | undefined, rahasia: string): Promise<boolean> {
  if (!token) return false;
  const [terbit, sig] = token.split(".");
  if (!terbit || !sig) return false;
  const umur = Date.now() - Number(terbit);
  if (!Number.isFinite(umur) || umur < 0 || umur > UMUR_SESI_MS) return false;
  return samaPersis(sig, await tandaTangan(terbit, rahasia));
}

/** Bandingkan password tanpa membocorkan panjangnya lewat waktu eksekusi. */
export async function passwordCocok(masukan: string, asli: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(masukan)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(asli)),
  ]);
  return samaPersis(hex(a), hex(b));
}
