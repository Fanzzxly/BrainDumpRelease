import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenofarm · Jurnal Ternak Petelur",
  description: "Pantau produksi, stok, dan keuangan usaha bebek petelur.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-latar text-teks antialiased">{children}</body>
    </html>
  );
}
