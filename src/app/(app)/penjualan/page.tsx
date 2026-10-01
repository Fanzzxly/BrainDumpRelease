import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KepalaKartu, Kosong, Label, Pesan, Tombol } from "@/components/ui";
import { aksiHapusPenjualan, aksiPenjualan } from "../actions";
import { getStok } from "@/lib/queries";
import { db } from "@/lib/supabase";
import { GRADES, angka, hariIni, rupiah, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

type Nota = {
  id: number;
  tanggal: string;
  pembeli: string;
  catatan: string | null;
  penjualan_item: { grade: string; jumlah: number; harga_satuan: number }[];
};

export default async function Penjualan({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const [stok, notaRes] = await Promise.all([
    getStok(),
    db()
      .from("penjualan")
      .select("id, tanggal, pembeli, catatan, penjualan_item(grade, jumlah, harga_satuan)")
      .order("tanggal", { ascending: false })
      .order("id", { ascending: false })
      .limit(30),
  ]);
  if (notaRes.error) throw notaRes.error;
  const nota = (notaRes.data ?? []) as unknown as Nota[];
  const sisa = new Map(stok.map((s) => [s.grade, s.sisa]));

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Penjualan"
        judul="Catat penjualan telur"
        deskripsi="Satu nota bisa memuat beberapa grade dengan harga masing-masing."
      />
      <Pesan jenis="ok" teks={sp.ok} />
      <Pesan jenis="galat" teks={sp.galat} />

      <Kartu>
        <KepalaKartu eyebrow="Nota baru" judul="Input penjualan" />
        <form action={aksiPenjualan} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Tanggal</Label>
              <Input type="date" name="tanggal" defaultValue={hariIni()} />
            </div>
            <div>
              <Label>Nama pembeli</Label>
              <Input name="pembeli" placeholder="mis. Pak Budi" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-[14px]">
              <thead>
                <tr className="text-left text-teks-samar">
                  <th className="pb-2 font-medium">Grade</th>
                  <th className="pb-2 font-medium">Stok</th>
                  <th className="pb-2 font-medium">Jumlah (butir)</th>
                  <th className="pb-2 font-medium">Harga / butir</th>
                </tr>
              </thead>
              <tbody>
                {GRADES.map((g) => (
                  <tr key={g}>
                    <td className="py-2 pr-3 font-semibold">{g}</td>
                    <td className="py-2 pr-3 text-teks-redup">{angka(sisa.get(g) ?? 0)}</td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        max={sisa.get(g) ?? 0}
                        name={`jumlah_${g}`}
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2">
                      <Input type="number" min={0} step={50} name={`harga_${g}`} placeholder="0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <Label>Catatan (opsional)</Label>
            <Input name="catatan" placeholder="mis. diantar, bayar tempo" />
          </div>

          <Tombol type="submit" className="self-start">
            Simpan penjualan
          </Tombol>
          <p className="text-[12px] text-teks-samar">
            Isi hanya grade yang terjual. Penjualan ditolak kalau melebihi stok.
          </p>
        </form>
      </Kartu>

      <Kartu>
        <KepalaKartu eyebrow="Riwayat" judul="Nota terakhir" />
        {nota.length === 0 ? (
          <Kosong pesan="Belum ada penjualan tercatat." />
        ) : (
          <ul className="flex flex-col">
            {nota.map((n) => {
              const total = n.penjualan_item.reduce(
                (s, i) => s + i.jumlah * Number(i.harga_satuan),
                0,
              );
              const butir = n.penjualan_item.reduce((s, i) => s + i.jumlah, 0);
              return (
                <li
                  key={n.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-garis-lembut py-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">
                      {n.pembeli || "Tanpa nama pembeli"}
                    </p>
                    <p className="mt-1 text-[12px] text-teks-samar">
                      {tanggalPendek(n.tanggal)} · {butir} butir
                      {n.catatan ? ` · ${n.catatan}` : ""}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2">
                      {n.penjualan_item.map((i, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#1d1d20] px-2.5 py-1 text-[12px] text-teks-redup"
                        >
                          {i.grade} · {i.jumlah} × {rupiah(Number(i.harga_satuan))}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[15px] font-bold text-hijau">{rupiah(total)}</span>
                    <form action={aksiHapusPenjualan}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        className="text-[12px] text-teks-samar underline underline-offset-4 hover:text-merah"
                      >
                        hapus
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
