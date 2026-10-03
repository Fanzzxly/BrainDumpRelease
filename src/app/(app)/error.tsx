"use client";

import { useEffect } from "react";
import { Tombol } from "@/components/ui";

/**
 * Jaring pengaman untuk galat di dalam halaman. Next menyembunyikan pesan
 * asli di production, jadi yang bisa ditampilkan hanya arahan umum plus
 * digest-nya untuk dicari di log Vercel.
 */
export default function Galat({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("halaman gagal dirender", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-6">
      <div className="kartu w-full max-w-lg p-7">
        <h1 className="text-[22px] font-bold">Halaman gagal dimuat</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-teks-redup">
          Biasanya karena database belum siap: <code>supabase/schema.sql</code> belum
          dijalankan, atau environment variable Supabase belum benar.
        </p>
        <ol className="mt-5 flex flex-col gap-2 text-[14px] text-teks-redup">
          <li>1. Jalankan <code>supabase/schema.sql</code> di Supabase SQL Editor.</li>
          <li>2. Cek SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel.</li>
          <li>3. Redeploy setelah mengubah environment variable.</li>
        </ol>
        {error.digest && (
          <p className="mt-5 text-[12px] text-teks-samar">
            Kode galat untuk dicari di Vercel → Logs: <code>{error.digest}</code>
          </p>
        )}
        <Tombol onClick={reset} className="mt-6">
          Coba lagi
        </Tombol>
      </div>
    </div>
  );
}
