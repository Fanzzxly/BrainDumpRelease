import JudulHalaman from "@/components/JudulHalaman";
import { Kartu, KepalaKartu } from "@/components/ui";
import { getStok } from "@/lib/queries";
import { angka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Stok() {
  const stok = await getStok();
  const total = stok.reduce((s, g) => s + g.sisa, 0);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Stok telur"
        judul="Telur tersedia"
        deskripsi="Stok = hasil klasifikasi − terjual − terpakai."
      />

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {stok.map((s) => (
          <div key={s.grade} className="kartu px-4 py-6 text-center">
            <p className="eyebrow">Grade {s.grade}</p>
            <p className="mt-3 text-[32px] font-bold leading-none">{angka(s.sisa)}</p>
            <p className="mt-2 text-[12px] text-teks-samar">butir</p>
          </div>
        ))}
      </div>

      <Kartu>
        <KepalaKartu eyebrow="Rincian" judul="Pergerakan per grade" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead>
              <tr className="border-b border-garis text-left text-teks-samar">
                <th className="pb-3 font-medium">Grade</th>
                <th className="pb-3 text-right font-medium">Masuk</th>
                <th className="pb-3 text-right font-medium">Terjual</th>
                <th className="pb-3 text-right font-medium">Terpakai</th>
                <th className="pb-3 text-right font-medium">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {stok.map((s) => (
                <tr key={s.grade} className="border-b border-garis-lembut last:border-0">
                  <td className="py-3 font-semibold">{s.grade}</td>
                  <td className="py-3 text-right">{angka(s.masuk)}</td>
                  <td className="py-3 text-right">{angka(s.terjual)}</td>
                  <td className="py-3 text-right">{angka(s.terpakai)}</td>
                  <td className="py-3 text-right font-semibold">{angka(s.sisa)}</td>
                </tr>
              ))}
            </tbody>
              <tfoot>
                <tr className="border-t border-garis">
                  <td className="pt-3 font-semibold">Total</td>
                  <td />
                  <td />
                  <td />
                  <td className="pt-3 text-right font-bold">{angka(total)}</td>
                </tr>
              </tfoot>
          </table>
        </div>
      </Kartu>
    </div>
  );
}
