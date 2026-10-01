import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KepalaKartu, Kosong, Label, Pesan, Tombol } from "@/components/ui";
import { aksiKlasifikasi, aksiProduksi } from "../actions";
import { getKandang, getKlasifikasiHari, getProduksiHari } from "@/lib/queries";
import { db } from "@/lib/supabase";
import { angka, hariIni, tanggalPanjang, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Produksi({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const tanggal = hariIni();
  const [kandang, produksi, klasifikasi, riwayat] = await Promise.all([
    getKandang(),
    getProduksiHari(tanggal),
    getKlasifikasiHari(tanggal),
    db()
      .from("klasifikasi")
      .select("*")
      .order("tanggal", { ascending: false })
      .limit(14)
      .then((r) => {
        if (r.error) throw r.error;
        return r.data ?? [];
      }),
  ]);
  const map = new Map(produksi.map((p) => [p.kandang_id, p.jumlah]));
  const total = produksi.reduce((s, p) => s + p.jumlah, 0);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Produksi harian"
        judul="Catat hasil telur"
        deskripsi={tanggalPanjang(tanggal)}
      />
      <Pesan jenis="ok" teks={sp.ok} />
      <Pesan jenis="galat" teks={sp.galat} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu eyebrow="Langkah 1" judul="Hasil per kandang" />
          <form action={aksiProduksi} className="flex flex-col gap-4">
            <input type="hidden" name="tanggal" value={tanggal} />
            {kandang.map((k) => (
              <div key={k.id}>
                <Label>
                  {k.nama}
                  {map.has(k.id) ? ` · tercatat ${map.get(k.id)} butir` : ""}
                </Label>
                <Input
                  type="number"
                  min={0}
                  name={`kandang_${k.id}`}
                  defaultValue={map.get(k.id) ?? ""}
                  placeholder="jumlah butir"
                />
              </div>
            ))}
            <Tombol type="submit">Simpan produksi</Tombol>
            <p className="text-[12px] text-teks-samar">
              Total tercatat hari ini: {angka(total)} butir.
            </p>
          </form>
        </Kartu>

        <Kartu>
          <KepalaKartu eyebrow="Langkah 2" judul="Klasifikasi grade" />
          <form action={aksiKlasifikasi} className="flex flex-col gap-4">
            <input type="hidden" name="tanggal" value={tanggal} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grade A</Label>
                <Input type="number" min={0} name="grade_a" defaultValue={klasifikasi?.grade_a ?? ""} />
              </div>
              <div>
                <Label>Grade AB</Label>
                <Input type="number" min={0} name="grade_ab" defaultValue={klasifikasi?.grade_ab ?? ""} />
              </div>
              <div>
                <Label>Grade B</Label>
                <Input type="number" min={0} name="grade_b" defaultValue={klasifikasi?.grade_b ?? ""} />
              </div>
              <div>
                <Label>Grade C (opsional)</Label>
                <Input
                  type="number"
                  min={0}
                  name="grade_c"
                  defaultValue={klasifikasi?.grade_c ?? ""}
                  placeholder="otomatis"
                />
              </div>
            </div>
            <Tombol type="submit">Simpan klasifikasi</Tombol>
            <p className="text-[12px] leading-relaxed text-teks-samar">
              Kosongkan grade C maka sisanya dihitung otomatis dari total produksi hari ini
              ({angka(total)} butir).
            </p>
          </form>
        </Kartu>
      </div>

      <Kartu>
        <KepalaKartu eyebrow="Riwayat" judul="Klasifikasi 14 hari terakhir" />
        {riwayat.length === 0 ? (
          <Kosong pesan="Belum ada klasifikasi tercatat." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[14px]">
              <thead>
                <tr className="border-b border-garis text-left text-teks-samar">
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 text-right font-medium">A</th>
                  <th className="pb-3 text-right font-medium">AB</th>
                  <th className="pb-3 text-right font-medium">B</th>
                  <th className="pb-3 text-right font-medium">C</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.tanggal} className="border-b border-garis-lembut last:border-0">
                    <td className="py-3">{tanggalPendek(r.tanggal)}</td>
                    <td className="py-3 text-right">{r.grade_a}</td>
                    <td className="py-3 text-right">{r.grade_ab}</td>
                    <td className="py-3 text-right">{r.grade_b}</td>
                    <td className="py-3 text-right">{r.grade_c}</td>
                    <td className="py-3 text-right font-semibold">
                      {r.grade_a + r.grade_ab + r.grade_b + r.grade_c}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kartu>
    </div>
  );
}
