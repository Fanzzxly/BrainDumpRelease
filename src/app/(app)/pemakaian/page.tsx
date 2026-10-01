import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KepalaKartu, Kosong, Label, Pesan, Select, Tombol } from "@/components/ui";
import { aksiAfkir, aksiPemakaian } from "../actions";
import { getKandang, getStok } from "@/lib/queries";
import { db } from "@/lib/supabase";
import { GRADES, angka, hariIni, tanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Pemakaian({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const [stok, kandang, pakaiRes, afkirRes] = await Promise.all([
    getStok(),
    getKandang(),
    db().from("pemakaian_telur").select("*").order("tanggal", { ascending: false }).limit(20),
    db().from("afkir").select("*").order("tanggal", { ascending: false }).limit(20),
  ]);
  if (pakaiRes.error) throw pakaiRes.error;
  if (afkirRes.error) throw afkirRes.error;
  const sisa = new Map(stok.map((s) => [s.grade, s.sisa]));

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Pemakaian & afkir"
        judul="Telur terpakai dan bebek afkir"
        deskripsi="Telur yang dimakan sendiri atau pecah mengurangi stok. Afkir mengurangi populasi."
      />
      <Pesan jenis="ok" teks={sp.ok} />
      <Pesan jenis="galat" teks={sp.galat} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu eyebrow="Telur" judul="Pemakaian telur" />
          <form action={aksiPemakaian} className="flex flex-col gap-4">
            <Input type="hidden" name="tanggal" defaultValue={hariIni()} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grade</Label>
                <Select name="grade" defaultValue="AB">
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g} · sisa {angka(sisa.get(g) ?? 0)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Jumlah (butir)</Label>
                <Input type="number" min={1} name="jumlah" required placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input name="keterangan" placeholder="mis. digoreng, pecah" />
            </div>
            <Tombol type="submit" className="self-start">
              Simpan pemakaian
            </Tombol>
          </form>
        </Kartu>

        <Kartu>
          <KepalaKartu eyebrow="Bebek" judul="Afkir bebek" />
          <form action={aksiAfkir} className="flex flex-col gap-4">
            <Input type="hidden" name="tanggal" defaultValue={hariIni()} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kandang</Label>
                <Select name="kandang_id" defaultValue={kandang[0]?.id ?? ""}>
                  {kandang.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} · {k.populasi} ekor
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Jumlah (ekor)</Label>
                <Input type="number" min={1} name="jumlah_afkir" required placeholder="0" />
              </div>
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input name="keterangan_afkir" placeholder="mis. sakit, tidak produktif" />
            </div>
            <Tombol type="submit" className="self-start">
              Simpan afkir
            </Tombol>
          </form>
        </Kartu>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu eyebrow="Riwayat" judul="Telur terpakai" />
          {(pakaiRes.data ?? []).length === 0 ? (
            <Kosong pesan="Belum ada pemakaian tercatat." />
          ) : (
            <ul className="flex flex-col">
              {(pakaiRes.data ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-garis-lembut py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">
                      {r.jumlah} butir · grade {r.grade}
                    </p>
                    <p className="mt-1 text-[12px] text-teks-samar">
                      {tanggalPendek(r.tanggal)}
                      {r.keterangan ? ` · ${r.keterangan}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Kartu>

        <Kartu>
          <KepalaKartu eyebrow="Riwayat" judul="Bebek afkir" />
          {(afkirRes.data ?? []).length === 0 ? (
            <Kosong pesan="Belum ada afkir tercatat." />
          ) : (
            <ul className="flex flex-col">
              {(afkirRes.data ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-garis-lembut py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">
                      {r.jumlah} ekor{r.kandang_id ? ` · Kandang ${r.kandang_id}` : ""}
                    </p>
                    <p className="mt-1 text-[12px] text-teks-samar">
                      {tanggalPendek(r.tanggal)}
                      {r.keterangan ? ` · ${r.keterangan}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </div>
  );
}
