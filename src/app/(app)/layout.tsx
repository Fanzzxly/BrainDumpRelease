import Sidebar from "@/components/Sidebar";
import { getKandang } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kandang = await getKandang();
  const aktif = kandang.filter((k) => k.aktif);
  const populasi = aktif.reduce((s, k) => s + k.populasi, 0);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Sidebar populasi={populasi} kandangAktif={aktif.length} />
      <main className="flex-1 p-5 lg:h-dvh lg:overflow-y-auto lg:p-10">{children}</main>
    </div>
  );
}
