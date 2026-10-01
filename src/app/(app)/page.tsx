import Link from "next/link";
import { Bar, Kartu, KartuStat, KepalaKartu, Kosong } from "@/components/ui";
import { IkonPenjualan, IkonPengeluaran, IkonTelur } from "@/components/ikon";
import { getRingkasan } from "@/lib/queries";
import { angka, rupiah, salam, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Ringkasan() {
  const r = await getRingkasan();
  const maksKandang = Math.max(1, ...r.kandang.map((k) => r.produksiMap.get(k.id) ?? 0));
  const maksArus = Math.max(1, r.keuangan.pemasukan, r.keuangan.pengeluaran);

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
      {/* ---------- kepala ---------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Ringkasan usaha</p>
          <h1 className="mt-3 text-[40px] font-bold leading-none lg:text-[46px]">
            {salam()} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-3 text-[15px] text-teks-redup">
            Pantau produksi, stok, dan keuangan usaha bebekmu.
          </p>
        </div>
        <Link
          href="/produksi"
          className="rounded-xl bg-[#1f1f23] px-4 py-3 text-[14px] font-semibold transition-colors hover:bg-[#2a2a30]"
        >
          + Produksi hari ini
        </Link>
      </header>

      {/* ---------- empat angka utama ---------- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Produksi hari ini"
          nilai={`${angka(r.produksiHariIni)} butir`}
          keterangan={`${r.persenProduksi.toFixed(0)}% dari populasi`}
          ikon={<IkonTelur className="h-4 w-4" />}
        />
        <KartuStat
          label="Total pemasukan"
          nilai={rupiah(r.keuangan.pemasukan)}
          keterangan="Penjualan tercatat"
          ikon={<span className="text-[13px] font-bold">Rp</span>}
        />
        <KartuStat
          label="Total pengeluaran"
          nilai={rupiah(r.keuangan.pengeluaran)}
          keterangan="Operasional usaha"
          ikon={<IkonPengeluaran className="h-4 w-4" />}
        />
        <KartuStat
          label="Laba operasional"
          nilai={rupiah(r.keuangan.laba)}
          keterangan="Pemasukan − pengeluaran"
          ikon={<IkonPenjualan className="h-4 w-4" />}
          hijau={r.keuangan.laba >= 0}
        />
      </div>

      {/* ---------- pengumpulan + stok ---------- */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Kartu>
          <KepalaKartu
            eyebrow="Pengumpulan hari ini"
            judul="Hasil per kandang"
            aksi={
              <Link
                href="/produksi"
                className="shrink-0 text-[13px] text-teks-redup transition-colors hover:text-teks"
              >
                Lihat catatan →
              </Link>
            }
          />
          <div className="flex flex-col">
            {r.kandang.map((k) => {
              const nilai = r.produksiMap.get(k.id);
              return (
                <div
                  key={k.id}
                  className="flex items-center gap-4 border-b border-garis-lembut py-4 last:border-0"
                >
                  <p className="w-28 shrink-0 text-[15px] font-semibold">{k.nama}</p>
                  <p className="w-28 shrink-0 text-[13px] text-teks-redup">
                    {nilai === undefined ? "Belum dicatat" : "Tercatat"}
                  </p>
                  <div className="flex-1">
                    <Bar rasio={(nilai ?? 0) / maksKandang} />
                  </div>
                  <p className="w-14 shrink-0 text-right text-[15px] font-semibold">
                    {nilai === undefined ? "—" : angka(nilai)}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-teks-samar">
            Setelah dikumpulkan, telur ketiga kandang digabung lalu diklasifikasi. Total hari
            ini: {angka(r.produksiHariIni)} butir.
            {r.klasifikasi
              ? ` Sudah diklasifikasi: A ${r.klasifikasi.grade_a}, AB ${r.klasifikasi.grade_ab}, B ${r.klasifikasi.grade_b}, C ${r.klasifikasi.grade_c}.`
              : " Klasifikasi grade belum diisi."}
          </p>
        </Kartu>

        <Kartu>
          <KepalaKartu
            eyebrow="Stok gabungan"
            judul="Telur tersedia"
            ikon={<IkonTelur className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {r.stok.map((s) => (
              <div
                key={s.grade}
                className="rounded-xl border border-garis bg-[#111113] px-3 py-5 text-center"
              >
                <p className="eyebrow">Grade {s.grade}</p>
                <p className="mt-3 text-[28px] font-bold leading-none">{angka(s.sisa)}</p>
                <p className="mt-2 text-[12px] text-teks-samar">butir</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-garis-lembut pt-5">
            <p className="text-[14px] text-teks-redup">Total stok</p>
            <p className="text-[15px] font-bold">{angka(r.totalStok)} butir</p>
          </div>
        </Kartu>
      </div>

      {/* ---------- arus kas + aktivitas ---------- */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Kartu>
          <KepalaKartu eyebrow="Keuangan" judul="Arus kas" />
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <p className="w-28 shrink-0 text-[14px] text-teks-redup">Pemasukan</p>
              <div className="flex-1">
                <Bar rasio={r.keuangan.pemasukan / maksArus} />
              </div>
              <p className="w-32 shrink-0 text-right text-[14px] font-semibold">
                {rupiah(r.keuangan.pemasukan)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="w-28 shrink-0 text-[14px] text-teks-redup">Pengeluaran</p>
              <div className="flex-1">
                <Bar rasio={r.keuangan.pengeluaran / maksArus} />
              </div>
              <p className="w-32 shrink-0 text-right text-[14px] font-semibold">
                {rupiah(r.keuangan.pengeluaran)}
              </p>
            </div>
          </div>
          <p className="mt-6 border-t border-garis-lembut pt-5 text-[13px] text-teks-samar">
            {r.keuangan.pengeluaran === 0
              ? "Belum ada pengeluaran."
              : `Laba operasional ${rupiah(r.keuangan.laba)}.`}
          </p>
        </Kartu>

        <Kartu>
          <KepalaKartu eyebrow="Aktivitas" judul="Catatan terbaru" />
          {r.aktivitas.length === 0 ? (
            <Kosong pesan="Belum ada catatan. Mulai dari produksi harian." />
          ) : (
            <ul className="flex flex-col">
              {r.aktivitas.map((a, i) => (
                <li
                  key={`${a.jenis}-${a.tanggal}-${i}`}
                  className="flex items-center gap-3 border-b border-garis-lembut py-3.5 last:border-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d1d20] text-teks-redup">
                    {a.jenis === "penjualan" ? (
                      <IkonPenjualan className="h-4 w-4" />
                    ) : a.jenis === "pengeluaran" ? (
                      <IkonPengeluaran className="h-4 w-4" />
                    ) : (
                      <IkonTelur className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{a.judul}</span>
                    <span className="block text-[12px] text-teks-samar">
                      {tanggalPendek(a.tanggal)} · {a.detail}
                    </span>
                  </span>
                  {a.nilai !== undefined && (
                    <span
                      className={`shrink-0 text-[13px] font-semibold ${
                        a.nilai >= 0 ? "text-hijau" : "text-merah"
                      }`}
                    >
                      {a.nilai >= 0 ? "+" : "−"}
                      {rupiah(Math.abs(a.nilai))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </div>
  );
}
