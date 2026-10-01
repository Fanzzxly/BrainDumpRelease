"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IkonBebek,
  IkonKandang,
  IkonLaporan,
  IkonPemakaian,
  IkonPengeluaran,
  IkonPenjualan,
  IkonProduksi,
  IkonRingkasan,
  IkonStok,
} from "./ikon";

const menu = [
  { href: "/", label: "Ringkasan", Ikon: IkonRingkasan },
  { href: "/produksi", label: "Produksi harian", Ikon: IkonProduksi },
  { href: "/stok", label: "Stok telur", Ikon: IkonStok },
  { href: "/penjualan", label: "Penjualan", Ikon: IkonPenjualan },
  { href: "/pemakaian", label: "Pemakaian & afkir", Ikon: IkonPemakaian },
  { href: "/pengeluaran", label: "Pengeluaran", Ikon: IkonPengeluaran },
  { href: "/laporan", label: "Laporan", Ikon: IkonLaporan },
  { href: "/kandang", label: "Kandang", Ikon: IkonKandang },
];

export default function Sidebar({
  populasi,
  kandangAktif,
}: {
  populasi: number;
  kandangAktif: number;
}) {
  const path = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 bg-panel p-5 lg:h-dvh lg:w-[300px] lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d1d20] text-teks">
          <IkonBebek />
        </div>
        <div>
          <p className="text-[19px] font-extrabold leading-none tracking-wide">ZENOFARM</p>
          <p className="eyebrow mt-1.5">Jurnal ternak petelur</p>
        </div>
      </div>

      <div className="kartu p-4">
        <p className="eyebrow">Populasi aktif</p>
        <p className="mt-2 text-3xl font-bold">{populasi} ekor</p>
        <p className="mt-2 flex items-center gap-2 text-[13px] text-teks-redup">
          <span className="h-1.5 w-1.5 rounded-full bg-teks-redup" />
          {kandangAktif} kandang aktif
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {menu.map(({ href, label, Ikon }) => {
          const aktif = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={aktif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors ${
                aktif
                  ? "bg-kartu font-semibold text-teks"
                  : "text-teks-redup hover:bg-kartu/60 hover:text-teks"
              }`}
            >
              <Ikon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-garis-lembut pt-4">
        <p className="text-[13px] font-semibold text-teks-redup">Data aman di server</p>
        <p className="mt-1 text-[12px] leading-relaxed text-teks-samar">
          Catatan tersimpan di database, bisa diisi lewat dashboard maupun bot Telegram.
        </p>
        <form action="/api/keluar" method="post" className="mt-3">
          <button
            type="submit"
            className="text-[12px] text-teks-samar underline underline-offset-4 hover:text-teks"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
