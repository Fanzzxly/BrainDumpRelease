import type { Diagnosa } from "@/lib/diagnosa";
import { IkonBebek } from "./ikon";

export default function LayarDiagnosa({ d }: { d: Diagnosa }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="kartu w-full max-w-xl p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d1d20]">
            <IkonBebek />
          </div>
          <div>
            <p className="text-[19px] font-extrabold leading-none tracking-wide">ZENOFARM</p>
            <p className="eyebrow mt-1.5">Perlu disiapkan dulu</p>
          </div>
        </div>

        <h1 className="mt-7 text-[24px] font-bold leading-tight">{d.judul}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-teks-redup">{d.sebab}</p>

        <ol className="mt-6 flex flex-col gap-3">
          {d.langkah.map((l, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d1d20] text-[12px] font-semibold text-teks-redup">
                {i + 1}
              </span>
              <span className="text-teks-redup">{l}</span>
            </li>
          ))}
        </ol>

        {d.teknis && (
          <details className="mt-6 border-t border-garis-lembut pt-5">
            <summary className="cursor-pointer text-[13px] text-teks-samar">
              Pesan teknis
            </summary>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0f0f11] p-4 text-[12px] leading-relaxed text-teks-redup">
              {d.teknis}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
