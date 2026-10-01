import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KepalaKartu, Kosong, Label, Pesan, Tombol } from "@/components/ui";
import { aksiHapusPengeluaran, aksiPengeluaran } from "../actions";
import { db } from "@/lib/supabase";
import { hariIni, rupiah, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Pengeluaran({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const { data, error } = await db()
    .from("pengeluaran")
    .select("*")
    .order("tanggal", { ascending: false })
    .order("id", { ascending: false })
    .limit(50);
  if (error) throw error;
  const daftar = data ?? [];
  const total = daftar.reduce((s, r) => s + Number(r.jumlah), 0);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Pengeluaran"
        judul="Biaya operasional"
        deskripsi="Tulis bebas keperluannya — pakan, obat, listrik, apa pun."
      />
      <Pesan jenis="ok" teks={sp.ok} />
      <Pesan jenis="galat" teks={sp.galat} />

      <Kartu>
        <KepalaKartu eyebrow="Catatan baru" judul="Input pengeluaran" />
        <form action={aksiPengeluaran} className="grid grid-cols-1 gap-4 sm:grid-cols-[150px_1fr_180px_auto] sm:items-end">
          <div>
            <Label>Tanggal</Label>
            <Input type="date" name="tanggal" defaultValue={hariIni()} />
          </div>
          <div>
            <Label>Keterangan</Label>
            <Input name="keterangan" required placeholder="mis. pakan 2 karung" />
          </div>
          <div>
            <Label>Nominal (Rp)</Label>
            <Input type="number" min={0} step={500} name="jumlah" required placeholder="0" />
          </div>
          <Tombol type="submit">Simpan</Tombol>
        </form>
      </Kartu>

      <Kartu>
        <KepalaKartu eyebrow="Riwayat" judul={`Total tercatat ${rupiah(total)}`} />
        {daftar.length === 0 ? (
          <Kosong pesan="Belum ada pengeluaran tercatat." />
        ) : (
          <ul className="flex flex-col">
            {daftar.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 border-b border-garis-lembut py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{r.keterangan}</p>
                  <p className="mt-1 text-[12px] text-teks-samar">{tanggalPendek(r.tanggal)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-[14px] font-semibold text-merah">
                    −{rupiah(Number(r.jumlah))}
                  </span>
                  <form action={aksiHapusPengeluaran}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-[12px] text-teks-samar underline underline-offset-4 hover:text-merah"
                    >
                      hapus
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </div>
  );
}
