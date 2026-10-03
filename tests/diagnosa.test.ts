import assert from "node:assert/strict";
import test from "node:test";
import { diagnosa } from "../src/lib/diagnosa";

test("PGRST125 diarahkan ke SUPABASE_URL yang salah bentuk", () => {
  const d = diagnosa({
    code: "PGRST125",
    message: "Invalid path specified in request URL",
  });
  assert.equal(d.judul, "SUPABASE_URL salah bentuk");
  assert.ok(d.langkah.some((l) => l.includes("garis miring")));
});

test("tabel belum ada dikenali dari kode 42P01", () => {
  const d = diagnosa({ code: "42P01", message: 'relation "kandang" does not exist' });
  assert.equal(d.judul, "Tabel database belum dibuat");
});

test("key ditolak dikenali", () => {
  const d = diagnosa({ message: "Invalid API key" });
  assert.equal(d.judul, "Key Supabase ditolak");
});

test("host tak terjangkau dikenali", () => {
  const d = diagnosa(new Error("fetch failed"));
  assert.equal(d.judul, "Database tidak bisa dihubungi");
});

test("environment variable kosong dikenali", () => {
  const d = diagnosa(new Error("Environment variable SUPABASE_URL belum diisi."));
  assert.equal(d.judul, "Environment variable belum lengkap");
});

test("galat tak dikenal tetap membawa pesan teknis", () => {
  const d = diagnosa(new Error("sesuatu yang aneh"));
  assert.equal(d.judul, "Gagal memuat data");
  assert.match(d.teknis ?? "", /sesuatu yang aneh/);
});
