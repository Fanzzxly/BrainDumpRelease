import Sidebar from "@/components/Sidebar";
import LayarDiagnosa from "@/components/LayarDiagnosa";
import { getKandang, type KandangRow } from "@/lib/queries";
import { diagnosa } from "@/lib/diagnosa";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Satu query murah sekaligus jadi pemeriksaan kesehatan: kalau database
  // belum siap, tampilkan penjelasan yang bisa ditindaklanjuti alih-alih
  // membiarkan setiap halaman gagal dengan layar error kosong.
  let kandang: KandangRow[];
  try {
    kandang = await getKandang();
  } catch (e) {
    return <LayarDiagnosa d={diagnosa(e)} />;
  }

  const aktif = kandang.filter((k) => k.aktif);
  const populasi = aktif.reduce((s, k) => s + k.populasi, 0);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar populasi={populasi} kandangAktif={aktif.length} />
      <main className="flex-1 p-5 lg:h-dvh lg:overflow-y-auto lg:p-10">{children}</main>
    </div>
  );
}
