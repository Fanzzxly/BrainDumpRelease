"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AturanBisnisError,
  catatAfkir,
  catatKlasifikasi,
  catatPemakaian,
  catatPengeluaran,
  catatPenjualan,
  catatProduksi,
  hapusEntri,
  type ItemJual,
} from "@/lib/queries";
import { db } from "@/lib/supabase";
import { GRADES, hariIni, normalisasiGrade, type Grade } from "@/lib/format";

function kembali(path: string, pesan: string, ok: boolean): never {
  revalidatePath(path);
  revalidatePath("/");
  redirect(`${path}?${ok ? "ok" : "galat"}=${encodeURIComponent(pesan)}`);
}

/** Jalankan aksi, ubah error aturan bisnis jadi pesan yang bisa dibaca. */
async function jalankan(path: string, fn: () => Promise<string>): Promise<never> {
  let pesan: string;
  let ok = true;
  try {
    pesan = await fn();
  } catch (e) {
    ok = false;
    pesan =
      e instanceof AturanBisnisError
        ? e.message
        : `Gagal menyimpan: ${e instanceof Error ? e.message : String(e)}`;
  }
  kembali(path, pesan, ok);
}

function int(fd: FormData, nama: string, bawaan = 0): number {
  const raw = String(fd.get(nama) ?? "").trim();
  if (raw === "") return bawaan;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new AturanBisnisError(`Nilai "${nama}" bukan angka.`);
  return Math.trunc(n);
}

function tanggalDari(fd: FormData): string {
  const t = String(fd.get("tanggal") ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : hariIni();
}

// ------------------------------------------------------------ produksi

export async function aksiProduksi(fd: FormData) {
  return jalankan("/produksi", async () => {
    const tanggal = tanggalDari(fd);
    const { data: kandang, error } = await db().from("kandang").select("id").order("urutan");
    if (error) throw error;

    let total = 0;
    for (const k of kandang ?? []) {
      const raw = String(fd.get(`kandang_${k.id}`) ?? "").trim();
      if (raw === "") continue;
      const jumlah = int(fd, `kandang_${k.id}`);
      await catatProduksi(tanggal, k.id, jumlah);
      total += jumlah;
    }
    if (total === 0 && !(kandang ?? []).some((k) => String(fd.get(`kandang_${k.id}`) ?? "").trim()))
      throw new AturanBisnisError("Isi minimal satu kandang.");
    return `Produksi ${tanggal} tersimpan: ${total} butir.`;
  });
}

export async function aksiKlasifikasi(fd: FormData) {
  return jalankan("/produksi", async () => {
    const tanggal = tanggalDari(fd);
    const cRaw = String(fd.get("grade_c") ?? "").trim();
    const hasil = await catatKlasifikasi(tanggal, {
      a: int(fd, "grade_a"),
      ab: int(fd, "grade_ab"),
      b: int(fd, "grade_b"),
      c: cRaw === "" ? undefined : int(fd, "grade_c"),
    });
    return `Klasifikasi ${tanggal} tersimpan: A ${hasil.a}, AB ${hasil.ab}, B ${hasil.b}, C ${hasil.c} (total ${hasil.total} butir).`;
  });
}

// ------------------------------------------------------------ penjualan

export async function aksiPenjualan(fd: FormData) {
  return jalankan("/penjualan", async () => {
    const tanggal = tanggalDari(fd);
    const pembeli = String(fd.get("pembeli") ?? "").trim();

    const items: ItemJual[] = [];
    for (const g of GRADES) {
      const jumlahRaw = String(fd.get(`jumlah_${g}`) ?? "").trim();
      if (jumlahRaw === "") continue;
      const jumlah = int(fd, `jumlah_${g}`);
      if (jumlah <= 0) continue;
      const harga = Number(String(fd.get(`harga_${g}`) ?? "").trim());
      if (!Number.isFinite(harga) || harga < 0)
        throw new AturanBisnisError(`Harga grade ${g} belum diisi dengan benar.`);
      items.push({ grade: g, jumlah, harga });
    }
    if (items.length === 0)
      throw new AturanBisnisError("Isi minimal satu grade beserta harganya.");

    const hasil = await catatPenjualan(
      tanggal,
      pembeli,
      items,
      String(fd.get("catatan") ?? "").trim() || undefined,
    );
    return `Penjualan tersimpan: ${hasil.butir} butir, total Rp ${new Intl.NumberFormat("id-ID").format(hasil.total)}.`;
  });
}

export async function aksiHapusPenjualan(fd: FormData) {
  return jalankan("/penjualan", async () => {
    const id = int(fd, "id");
    const { error } = await db().from("penjualan").delete().eq("id", id);
    if (error) throw error;
    return "Nota penjualan dihapus.";
  });
}

// ------------------------------------------------------------ pengeluaran

export async function aksiPengeluaran(fd: FormData) {
  return jalankan("/pengeluaran", async () => {
    const tanggal = tanggalDari(fd);
    const keterangan = String(fd.get("keterangan") ?? "");
    const jumlah = Number(String(fd.get("jumlah") ?? "").trim());
    if (!Number.isFinite(jumlah)) throw new AturanBisnisError("Nominal belum diisi.");
    await catatPengeluaran(tanggal, keterangan, jumlah);
    return `Pengeluaran tersimpan: ${keterangan.trim()}.`;
  });
}

export async function aksiHapusPengeluaran(fd: FormData) {
  return jalankan("/pengeluaran", async () => {
    const { error } = await db().from("pengeluaran").delete().eq("id", int(fd, "id"));
    if (error) throw error;
    return "Pengeluaran dihapus.";
  });
}

// ------------------------------------------------------------ pemakaian & afkir

export async function aksiPemakaian(fd: FormData) {
  return jalankan("/pemakaian", async () => {
    const tanggal = tanggalDari(fd);
    const grade = normalisasiGrade(String(fd.get("grade") ?? ""));
    if (!grade) throw new AturanBisnisError("Grade tidak dikenali.");
    const jumlah = int(fd, "jumlah");
    const hasil = await catatPemakaian(
      tanggal,
      grade,
      jumlah,
      String(fd.get("keterangan") ?? ""),
    );
    return `Pemakaian tersimpan: ${jumlah} butir grade ${grade}. Sisa stok ${grade}: ${hasil.sisaBaru} butir.`;
  });
}

export async function aksiAfkir(fd: FormData) {
  return jalankan("/pemakaian", async () => {
    const tanggal = tanggalDari(fd);
    const kandangId = String(fd.get("kandang_id") ?? "").trim() || null;
    const jumlah = int(fd, "jumlah_afkir");
    await catatAfkir(tanggal, kandangId, jumlah, String(fd.get("keterangan_afkir") ?? ""));
    return `Afkir tersimpan: ${jumlah} ekor${kandangId ? ` dari Kandang ${kandangId}` : ""}.`;
  });
}

export async function aksiHapusPemakaian(fd: FormData) {
  return jalankan("/pemakaian", async () => {
    const ringkas = await hapusEntri("pemakaian", int(fd, "id"));
    return `Dihapus: ${ringkas}. Stoknya kembali.`;
  });
}

export async function aksiHapusAfkir(fd: FormData) {
  return jalankan("/pemakaian", async () => {
    const ringkas = await hapusEntri("afkir", int(fd, "id"));
    return `Dihapus: ${ringkas}. Populasinya kembali.`;
  });
}

// ------------------------------------------------------------ kandang

export async function aksiKandang(fd: FormData) {
  return jalankan("/kandang", async () => {
    const id = String(fd.get("id") ?? "").trim().toUpperCase();
    const nama = String(fd.get("nama") ?? "").trim();
    const populasi = int(fd, "populasi_awal");
    if (!id) throw new AturanBisnisError("ID kandang wajib diisi.");
    if (populasi < 0) throw new AturanBisnisError("Populasi tidak boleh negatif.");
    const { error } = await db()
      .from("kandang")
      .upsert(
        {
          id,
          nama: nama || `Kandang ${id}`,
          populasi_awal: populasi,
          aktif: fd.get("aktif") === "on",
          urutan: int(fd, "urutan", 99),
        },
        { onConflict: "id" },
      );
    if (error) throw error;
    return `Kandang ${id} tersimpan.`;
  });
}

export type { Grade };
