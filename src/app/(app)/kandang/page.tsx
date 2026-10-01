import JudulHalaman from "@/components/JudulHalaman";
import { Input, Kartu, KepalaKartu, Label, Pesan, Tombol } from "@/components/ui";
import { aksiKandang } from "../actions";
import { getKandang } from "@/lib/queries";
import { angka } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Kandang({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const kandang = await getKandang();

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <JudulHalaman
        eyebrow="Kandang"
        judul="Populasi & kandang"
        deskripsi="Populasi aktual = populasi awal − total afkir."
      />
      <Pesan jenis="ok" teks={sp.ok} />
      <Pesan jenis="galat" teks={sp.galat} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {kandang.map((k) => (
          <Kartu key={k.id}>
            <KepalaKartu eyebrow={`Kandang ${k.id}`} judul={`${angka(k.populasi)} ekor`} />
            <form action={aksiKandang} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={k.id} />
              <input type="hidden" name="urutan" value={k.urutan} />
              <div>
                <Label>Nama</Label>
                <Input name="nama" defaultValue={k.nama} />
              </div>
              <div>
                <Label>Populasi awal</Label>
                <Input type="number" min={0} name="populasi_awal" defaultValue={k.populasi_awal} />
              </div>
              <label className="flex items-center gap-2 text-[14px] text-teks-redup">
                <input
                  type="checkbox"
                  name="aktif"
                  defaultChecked={k.aktif}
                  className="h-4 w-4 accent-[#5a5a62]"
                />
                Kandang aktif
              </label>
              <p className="text-[12px] text-teks-samar">
                Total afkir tercatat: {angka(k.total_afkir)} ekor.
              </p>
              <Tombol type="submit">Simpan</Tombol>
            </form>
          </Kartu>
        ))}
      </div>

      <Kartu>
        <KepalaKartu eyebrow="Tambah" judul="Kandang baru" />
        <form action={aksiKandang} className="grid grid-cols-1 gap-4 sm:grid-cols-[110px_1fr_170px_auto] sm:items-end">
          <div>
            <Label>ID</Label>
            <Input name="id" required maxLength={4} placeholder="D" />
          </div>
          <div>
            <Label>Nama</Label>
            <Input name="nama" placeholder="Kandang D" />
          </div>
          <div>
            <Label>Populasi awal</Label>
            <Input type="number" min={0} name="populasi_awal" defaultValue={0} />
          </div>
          <input type="hidden" name="aktif" value="on" />
          <Tombol type="submit">Tambah</Tombol>
        </form>
      </Kartu>
    </div>
  );
}
