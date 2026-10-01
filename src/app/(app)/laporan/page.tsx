import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KartuStat, KepalaKartu, Kosong, Label, Tombol } from "@/components/ui";
import { IkonPengeluaran, IkonPenjualan, IkonTelur } from "@/components/ikon";
import { getKeuangan } from "@/lib/queries";
import { db } from "@/lib/supabase";
import { angka, geserHari, hariIni, rupiah, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Laporan({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  const sp = await searchParams;
  const sampai = /^\d{4}-\d{2}-\d{2}$/.test(sp.sampai ?? "") ? sp.sampai! : hariIni();
  const dari = /^\d{4}-\d{2}-\d{2}$/.test(sp.dari ?? "") ? sp.dari! : geserHari(sampai, -29);

  const [keuangan, klasRes, jualRes, keluarRes, pakaiRes] = await Promise.all([
    getKeuangan(dari, sampai),
    db().from("klasifikasi").select("*").gte("tanggal", dari).lte("tanggal", sampai),
    db()
      .from("penjualan_total")
      .select("*")
      .gte("tanggal", dari)
      .lte("tanggal", sampai)
      .order("tanggal", { ascending: false }),
    db().from("pengeluaran").select("*").gte("tanggal", dari).lte("tanggal", sampai),
    db().from("pemakaian_telur").select("*").gte("tanggal", dari).lte("tanggal", sampai),
  ]);
  for (const r of [klasRes, jualRes, keluarRes, pakaiRes]) if (r.error) throw r.error;

  const klas = klasRes.data ?? [];
  const totalProduksi = klas.reduce(
    (s, r) => s + r.grade_a + r.grade_ab + r.grade_b + r.grade_c,
    0,
  );
  const perGrade = {
    A: klas.reduce((s, r) => s + r.grade_a, 0),
    AB: klas.reduce((s, r) => s + r.grade_ab, 0),
    B: klas.reduce((s, r) => s + r.grade_b, 0),
    C: klas.reduce((s, r) => s + r.grade_c, 0),
  };
  const totalTerjual = (jualRes.data ?? []).reduce((s, r) => s + Number(r.total_butir), 0);
  const totalTerpakai = (pakaiRes.data ?? []).reduce((s, r) => s + r.jumlah, 0);
  const hargaRata = totalTerjual > 0 ? keuangan.pemasukan / totalTerjual : 0;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Laporan"
        judul="Rekap periode"
        deskripsi={`${tanggalPendek(dari)} — ${tanggalPendek(sampai)}`}
      />

      <Kartu>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_180px_auto] sm:items-end">
          <div>
            <Label>Dari tanggal</Label>
            <Input type="date" name="dari" defaultValue={dari} />
          </div>
          <div>
            <Label>Sampai tanggal</Label>
            <Input type="date" name="sampai" defaultValue={sampai} />
          </div>
          <Tombol type="submit">Tampilkan</Tombol>
        </form>
      </Kartu>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Telur diklasifikasi"
          nilai={`${angka(totalProduksi)} butir`}
          keterangan={`${klas.length} hari tercatat`}
          ikon={<IkonTelur className="h-4 w-4" />}
        />
        <KartuStat
          label="Pemasukan"
          nilai={rupiah(keuangan.pemasukan)}
          keterangan={`${angka(totalTerjual)} butir terjual`}
          ikon={<span className="text-[13px] font-bold">Rp</span>}
        />
        <KartuStat
          label="Pengeluaran"
          nilai={rupiah(keuangan.pengeluaran)}
          keterangan={`${(keluarRes.data ?? []).length} catatan`}
          ikon={<IkonPengeluaran className="h-4 w-4" />}
        />
        <KartuStat
          label="Laba operasional"
          nilai={rupiah(keuangan.laba)}
          keterangan={`Harga rata-rata ${rupiah(hargaRata)}/butir`}
          ikon={<IkonPenjualan className="h-4 w-4" />}
          hijau={keuangan.laba >= 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Kartu>
          <KepalaKartu eyebrow="Komposisi" judul="Telur per grade" />
          <div className="flex flex-col gap-4">
            {(Object.entries(perGrade) as [string, number][]).map(([g, n]) => (
              <div key={g} className="flex items-center gap-4">
                <p className="w-16 shrink-0 text-[14px] font-semibold">Grade {g}</p>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#232327]">
                  <div
                    className="h-full rounded-full bg-[#5a5a62]"
                    style={{ width: `${totalProduksi > 0 ? (n / totalProduksi) * 100 : 0}%` }}
                  />
                </div>
                <p className="w-28 shrink-0 text-right text-[14px]">
                  {angka(n)}{" "}
                  <span className="text-teks-samar">
                    ({totalProduksi > 0 ? ((n / totalProduksi) * 100).toFixed(0) : 0}%)
                  </span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-garis-lembut pt-5 text-[13px] text-teks-samar">
            Terpakai sendiri / pecah dalam periode ini: {angka(totalTerpakai)} butir.
          </p>
        </Kartu>

        <Kartu>
          <KepalaKartu eyebrow="Penjualan" judul="Nota dalam periode" />
          {(jualRes.data ?? []).length === 0 ? (
            <Kosong pesan="Tidak ada penjualan pada periode ini." />
          ) : (
            <ul className="flex flex-col">
              {(jualRes.data ?? []).map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-4 border-b border-garis-lembut py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">
                      {n.pembeli || "Tanpa nama pembeli"}
                    </p>
                    <p className="mt-1 text-[12px] text-teks-samar">
                      {tanggalPendek(n.tanggal)} · {n.total_butir} butir
                    </p>
                  </div>
                  <span className="shrink-0 text-[14px] font-semibold text-hijau">
                    {rupiah(Number(n.total_rp))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </div>
  );
}
