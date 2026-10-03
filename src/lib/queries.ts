import { db } from "./supabase";
import { GRADES, type Grade, angka, hariIni, rupiah } from "./format";

export type StokGrade = {
  grade: Grade;
  masuk: number;
  terjual: number;
  terpakai: number;
  sisa: number;
};

export type KandangRow = {
  id: string;
  nama: string;
  populasi_awal: number;
  total_afkir: number;
  populasi: number;
  aktif: boolean;
  urutan: number;
};

export class AturanBisnisError extends Error {}

// ---------------------------------------------------------------- baca

export async function getStok(): Promise<StokGrade[]> {
  const { data, error } = await db().from("stok_telur").select("*");
  if (error) throw error;
  const map = new Map((data ?? []).map((r) => [r.grade as Grade, r as StokGrade]));
  return GRADES.map(
    (g) =>
      map.get(g) ?? { grade: g, masuk: 0, terjual: 0, terpakai: 0, sisa: 0 },
  );
}

export async function getKandang(): Promise<KandangRow[]> {
  const { data, error } = await db()
    .from("populasi_kandang")
    .select("*")
    .order("urutan");
  if (error) throw error;
  return (data ?? []) as KandangRow[];
}

export async function getProduksiHari(tanggal: string) {
  const { data, error } = await db()
    .from("produksi")
    .select("kandang_id, jumlah")
    .eq("tanggal", tanggal);
  if (error) throw error;
  return (data ?? []) as { kandang_id: string; jumlah: number }[];
}

export async function getKlasifikasiHari(tanggal: string) {
  const { data, error } = await db()
    .from("klasifikasi")
    .select("*")
    .eq("tanggal", tanggal)
    .maybeSingle();
  if (error) throw error;
  return data as {
    tanggal: string;
    grade_a: number;
    grade_ab: number;
    grade_b: number;
    grade_c: number;
  } | null;
}

/** Total pemasukan & pengeluaran sepanjang periode (kosongkan untuk semua waktu). */
export async function getKeuangan(dari?: string, sampai?: string) {
  let jual = db().from("penjualan_total").select("tanggal, total_rp");
  let keluar = db().from("pengeluaran").select("tanggal, jumlah");
  if (dari) {
    jual = jual.gte("tanggal", dari);
    keluar = keluar.gte("tanggal", dari);
  }
  if (sampai) {
    jual = jual.lte("tanggal", sampai);
    keluar = keluar.lte("tanggal", sampai);
  }
  const [a, b] = await Promise.all([jual, keluar]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  const pemasukan = (a.data ?? []).reduce((s, r) => s + Number(r.total_rp), 0);
  const pengeluaran = (b.data ?? []).reduce((s, r) => s + Number(r.jumlah), 0);
  return { pemasukan, pengeluaran, laba: pemasukan - pengeluaran };
}

export type Aktivitas = {
  jenis: "klasifikasi" | "penjualan" | "pengeluaran" | "pemakaian" | "afkir";
  judul: string;
  tanggal: string;
  detail: string;
  nilai?: number;
};

export async function getAktivitas(batas = 12): Promise<Aktivitas[]> {
  const [kl, pj, pg, pm, af] = await Promise.all([
    db().from("klasifikasi").select("*").order("tanggal", { ascending: false }).limit(batas),
    db().from("penjualan_total").select("*").order("tanggal", { ascending: false }).limit(batas),
    db().from("pengeluaran").select("*").order("tanggal", { ascending: false }).limit(batas),
    db().from("pemakaian_telur").select("*").order("tanggal", { ascending: false }).limit(batas),
    db().from("afkir").select("*").order("tanggal", { ascending: false }).limit(batas),
  ]);
  for (const r of [kl, pj, pg, pm, af]) if (r.error) throw r.error;

  const out: Aktivitas[] = [];
  for (const r of kl.data ?? []) {
    const total = r.grade_a + r.grade_ab + r.grade_b + r.grade_c;
    out.push({
      jenis: "klasifikasi",
      judul: "Pengumpulan & klasifikasi ABC",
      tanggal: r.tanggal,
      detail: `${total} butir`,
    });
  }
  for (const r of pj.data ?? []) {
    out.push({
      jenis: "penjualan",
      judul: r.pembeli ? `Penjualan ke ${r.pembeli}` : "Penjualan telur",
      tanggal: r.tanggal,
      detail: `${r.total_butir} butir`,
      nilai: Number(r.total_rp),
    });
  }
  for (const r of pg.data ?? []) {
    out.push({
      jenis: "pengeluaran",
      judul: r.keterangan,
      tanggal: r.tanggal,
      detail: "Pengeluaran",
      nilai: -Number(r.jumlah),
    });
  }
  for (const r of pm.data ?? []) {
    out.push({
      jenis: "pemakaian",
      judul: `Pemakaian telur ${r.grade}`,
      tanggal: r.tanggal,
      detail: `${r.jumlah} butir${r.keterangan ? ` · ${r.keterangan}` : ""}`,
    });
  }
  for (const r of af.data ?? []) {
    out.push({
      jenis: "afkir",
      judul: `Afkir bebek${r.kandang_id ? ` Kandang ${r.kandang_id}` : ""}`,
      tanggal: r.tanggal,
      detail: `${r.jumlah} ekor${r.keterangan ? ` · ${r.keterangan}` : ""}`,
    });
  }
  return out
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0))
    .slice(0, batas);
}

// ---------------------------------------------------------------- tulis

export async function catatProduksi(
  tanggal: string,
  kandangId: string,
  jumlah: number,
) {
  if (!Number.isInteger(jumlah) || jumlah < 0)
    throw new AturanBisnisError("Jumlah telur harus bilangan bulat 0 atau lebih.");
  const { error } = await db()
    .from("produksi")
    .upsert({ tanggal, kandang_id: kandangId, jumlah }, { onConflict: "tanggal,kandang_id" });
  if (error) throw error;
}

/**
 * Simpan klasifikasi grade. Kalau `c` tidak diisi, sisanya dihitung dari
 * total produksi hari itu (sesuai alur: A/AB/B diukur, C = sisanya).
 */
export async function catatKlasifikasi(
  tanggal: string,
  nilai: { a: number; ab: number; b: number; c?: number },
) {
  const { a, ab, b } = nilai;
  for (const [nama, n] of [["A", a], ["AB", ab], ["B", b]] as const) {
    if (!Number.isInteger(n) || n < 0)
      throw new AturanBisnisError(`Grade ${nama} harus bilangan bulat 0 atau lebih.`);
  }

  let c = nilai.c;
  if (c === undefined) {
    const produksi = await getProduksiHari(tanggal);
    const total = produksi.reduce((s, r) => s + r.jumlah, 0);
    if (total === 0)
      throw new AturanBisnisError(
        "Produksi harian belum dicatat, jadi grade C tidak bisa dihitung otomatis. " +
          "Catat produksi per kandang dulu, atau sebutkan jumlah C secara eksplisit.",
      );
    c = total - (a + ab + b);
    if (c < 0)
      throw new AturanBisnisError(
        `A + AB + B = ${a + ab + b} butir, melebihi total produksi hari itu (${total} butir).`,
      );
  }
  if (!Number.isInteger(c) || c < 0)
    throw new AturanBisnisError("Grade C harus bilangan bulat 0 atau lebih.");

  const { error } = await db()
    .from("klasifikasi")
    .upsert(
      { tanggal, grade_a: a, grade_ab: ab, grade_b: b, grade_c: c },
      { onConflict: "tanggal" },
    );
  if (error) throw error;
  return { a, ab, b, c, total: a + ab + b + c };
}

export type ItemJual = { grade: Grade; jumlah: number; harga: number };

export async function catatPenjualan(
  tanggal: string,
  pembeli: string,
  items: ItemJual[],
  catatan?: string,
) {
  if (items.length === 0)
    throw new AturanBisnisError("Penjualan harus memuat minimal satu grade.");

  // Gabungkan grade yang sama supaya pengecekan stok akurat.
  const perGrade = new Map<Grade, number>();
  for (const it of items) {
    if (!Number.isInteger(it.jumlah) || it.jumlah <= 0)
      throw new AturanBisnisError(`Jumlah grade ${it.grade} harus lebih dari 0.`);
    if (!(it.harga >= 0))
      throw new AturanBisnisError(`Harga grade ${it.grade} tidak valid.`);
    perGrade.set(it.grade, (perGrade.get(it.grade) ?? 0) + it.jumlah);
  }

  const stok = await getStok();
  for (const [grade, jumlah] of perGrade) {
    const sisa = stok.find((s) => s.grade === grade)?.sisa ?? 0;
    if (jumlah > sisa)
      throw new AturanBisnisError(
        `Stok grade ${grade} tidak cukup: tersedia ${sisa} butir, diminta ${jumlah} butir.`,
      );
  }

  const { data, error } = await db()
    .from("penjualan")
    .insert({ tanggal, pembeli, catatan: catatan ?? null })
    .select("id")
    .single();
  if (error) throw error;

  const { error: errItem } = await db().from("penjualan_item").insert(
    items.map((it) => ({
      penjualan_id: data.id,
      grade: it.grade,
      jumlah: it.jumlah,
      harga_satuan: it.harga,
    })),
  );
  if (errItem) {
    // Jangan tinggalkan nota tanpa isi kalau penyisipan item gagal.
    await db().from("penjualan").delete().eq("id", data.id);
    throw errItem;
  }

  const total = items.reduce((s, it) => s + it.jumlah * it.harga, 0);
  const butir = items.reduce((s, it) => s + it.jumlah, 0);
  return { id: data.id as number, total, butir };
}

export async function catatPengeluaran(
  tanggal: string,
  keterangan: string,
  jumlah: number,
) {
  if (!keterangan.trim())
    throw new AturanBisnisError("Keterangan pengeluaran tidak boleh kosong.");
  if (!(jumlah >= 0)) throw new AturanBisnisError("Nominal pengeluaran tidak valid.");
  const { error } = await db()
    .from("pengeluaran")
    .insert({ tanggal, keterangan: keterangan.trim(), jumlah });
  if (error) throw error;
}

export async function catatPemakaian(
  tanggal: string,
  grade: Grade,
  jumlah: number,
  keterangan?: string,
) {
  if (!Number.isInteger(jumlah) || jumlah <= 0)
    throw new AturanBisnisError("Jumlah telur terpakai harus lebih dari 0.");
  const stok = await getStok();
  const sisa = stok.find((s) => s.grade === grade)?.sisa ?? 0;
  if (jumlah > sisa)
    throw new AturanBisnisError(
      `Stok grade ${grade} tidak cukup: tersedia ${sisa} butir, diminta ${jumlah} butir.`,
    );
  const { error } = await db()
    .from("pemakaian_telur")
    .insert({ tanggal, grade, jumlah, keterangan: keterangan?.trim() || null });
  if (error) throw error;
  return { sisaBaru: sisa - jumlah };
}

export async function catatAfkir(
  tanggal: string,
  kandangId: string | null,
  jumlah: number,
  keterangan?: string,
) {
  if (!Number.isInteger(jumlah) || jumlah <= 0)
    throw new AturanBisnisError("Jumlah afkir harus lebih dari 0.");
  if (kandangId) {
    const kandang = await getKandang();
    const k = kandang.find((x) => x.id === kandangId);
    if (!k) throw new AturanBisnisError(`Kandang ${kandangId} tidak ditemukan.`);
    if (jumlah > k.populasi)
      throw new AturanBisnisError(
        `Populasi Kandang ${kandangId} cuma ${k.populasi} ekor, tidak bisa afkir ${jumlah} ekor.`,
      );
  }
  const { error } = await db()
    .from("afkir")
    .insert({ tanggal, kandang_id: kandangId, jumlah, keterangan: keterangan?.trim() || null });
  if (error) throw error;
}

// ---------------------------------------------------------------- koreksi

export const JENIS_ENTRI = [
  "produksi",
  "klasifikasi",
  "penjualan",
  "pengeluaran",
  "pemakaian",
  "afkir",
] as const;
export type JenisEntri = (typeof JENIS_ENTRI)[number];

/** Tabel yang dihapus untuk setiap jenis entri. */
const TABEL: Record<JenisEntri, string> = {
  produksi: "produksi",
  klasifikasi: "klasifikasi",
  penjualan: "penjualan",
  pengeluaran: "pengeluaran",
  pemakaian: "pemakaian_telur",
  afkir: "afkir",
};

/**
 * Tempat membaca entri. Sama dengan TABEL kecuali penjualan: notanya dibaca
 * dari view supaya totalnya ikut terbaca, tapi penghapusan tetap ke tabelnya
 * (itemnya hilang sendiri lewat on delete cascade).
 */
const SUMBER: Record<JenisEntri, string> = { ...TABEL, penjualan: "penjualan_total" };

export type Entri = {
  jenis: JenisEntri;
  id: number;
  tanggal: string;
  dicatatPada: string;
  ringkas: string;
};

/** Baris mentah dari Supabase; bentuk kolomnya beda-beda per jenis entri. */
type BarisMentah = Record<string, unknown>;

const num = (v: unknown): number => Number(v ?? 0);
const teks = (v: unknown): string => (v == null ? "" : String(v));

/** Satu baris yang bisa dibaca manusia, dipakai bot maupun dashboard. */
function ringkasEntri(jenis: JenisEntri, r: BarisMentah): string {
  const ket = teks(r.keterangan) ? ` · ${teks(r.keterangan)}` : "";
  switch (jenis) {
    case "produksi":
      return `Produksi Kandang ${teks(r.kandang_id)} — ${angka(num(r.jumlah))} butir`;
    case "klasifikasi": {
      const a = num(r.grade_a);
      const ab = num(r.grade_ab);
      const b = num(r.grade_b);
      const c = num(r.grade_c);
      return `Klasifikasi A ${a} · AB ${ab} · B ${b} · C ${c} — ${angka(a + ab + b + c)} butir`;
    }
    case "penjualan":
      return `Penjualan ${teks(r.pembeli) || "tanpa nama"} — ${angka(num(r.total_butir))} butir · ${rupiah(num(r.total_rp))}`;
    case "pengeluaran":
      return `Pengeluaran ${teks(r.keterangan)} — ${rupiah(num(r.jumlah))}`;
    case "pemakaian":
      return `Pemakaian grade ${teks(r.grade)} — ${angka(num(r.jumlah))} butir${ket}`;
    case "afkir":
      return `Afkir${teks(r.kandang_id) ? ` Kandang ${teks(r.kandang_id)}` : ""} — ${angka(num(r.jumlah))} ekor${ket}`;
  }
}

/**
 * Entri terakhir dari semua jenis catatan, terbaru dulu. Urutannya memakai
 * `dicatat_pada`, bukan `tanggal`: yang mau dibatalkan adalah yang terakhir
 * diketik, meski tanggalnya mundur.
 */
export async function getEntriTerakhir(batas = 10): Promise<Entri[]> {
  const hasil = await Promise.all(
    JENIS_ENTRI.map((jenis) =>
      db()
        .from(SUMBER[jenis])
        .select("*")
        .order("dicatat_pada", { ascending: false })
        .limit(batas)
        .then((r) => {
          if (r.error) throw r.error;
          return (r.data ?? []).map((row) => ({
            jenis,
            id: row.id as number,
            tanggal: row.tanggal as string,
            dicatatPada: row.dicatat_pada as string,
            ringkas: ringkasEntri(jenis, row),
          }));
        }),
    ),
  );

  return hasil
    .flat()
    .sort((a, b) => (a.dicatatPada < b.dicatatPada ? 1 : a.dicatatPada > b.dicatatPada ? -1 : 0))
    .slice(0, batas);
}

/**
 * Hapus satu entri dan kembalikan ringkasannya supaya pemanggil bisa
 * memberitahu apa yang baru saja hilang.
 */
export async function hapusEntri(jenis: JenisEntri, id: number): Promise<string> {
  const { data, error } = await db()
    .from(SUMBER[jenis])
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new AturanBisnisError(
      `Catatan ${jenis} tidak ditemukan — mungkin sudah dihapus dari tempat lain.`,
    );

  // Klasifikasi adalah satu-satunya sumber "telur masuk". Menghapusnya bisa
  // membuat stok minus kalau telurnya sudah terjual atau terpakai, jadi
  // dicegah di sini supaya angka stok tetap masuk akal.
  if (jenis === "klasifikasi") {
    const stok = await getStok();
    const dibatalkan: [Grade, number][] = [
      ["A", num(data.grade_a)],
      ["AB", num(data.grade_ab)],
      ["B", num(data.grade_b)],
      ["C", num(data.grade_c)],
    ];
    for (const [grade, jumlah] of dibatalkan) {
      const sisa = stok.find((s) => s.grade === grade)?.sisa ?? 0;
      if (jumlah > sisa)
        throw new AturanBisnisError(
          `Klasifikasi ini tidak bisa dibatalkan: ${jumlah} butir grade ${grade} sudah terjual ` +
            `atau terpakai (sisa stok cuma ${sisa} butir). Batalkan penjualan atau pemakaiannya dulu.`,
        );
    }
  }

  const ringkas = ringkasEntri(jenis, data);
  const { error: errHapus } = await db().from(TABEL[jenis]).delete().eq("id", id);
  if (errHapus) throw errHapus;
  return ringkas;
}

// ---------------------------------------------------------------- ringkasan

export async function getRingkasan(tanggal = hariIni()) {
  const [stok, kandang, produksi, klasifikasi, keuangan, aktivitas] =
    await Promise.all([
      getStok(),
      getKandang(),
      getProduksiHari(tanggal),
      getKlasifikasiHari(tanggal),
      getKeuangan(),
      getAktivitas(8),
    ]);

  const produksiMap = new Map(produksi.map((p) => [p.kandang_id, p.jumlah]));
  const produksiHariIni = produksi.reduce((s, p) => s + p.jumlah, 0);
  const populasi = kandang
    .filter((k) => k.aktif)
    .reduce((s, k) => s + k.populasi, 0);

  return {
    tanggal,
    stok,
    totalStok: stok.reduce((s, g) => s + g.sisa, 0),
    kandang,
    produksiMap,
    produksiHariIni,
    klasifikasi,
    populasi,
    kandangAktif: kandang.filter((k) => k.aktif).length,
    keuangan,
    aktivitas,
    persenProduksi: populasi > 0 ? (produksiHariIni / populasi) * 100 : 0,
  };
}
