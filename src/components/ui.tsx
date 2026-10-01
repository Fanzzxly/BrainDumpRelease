import type { ReactNode } from "react";

export function Kartu({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`kartu p-5 lg:p-6 ${className}`}>{children}</section>;
}

export function KepalaKartu({
  eyebrow,
  judul,
  aksi,
  ikon,
}: {
  eyebrow: string;
  judul: string;
  aksi?: ReactNode;
  ikon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-[22px] font-bold leading-tight">{judul}</h2>
      </div>
      {aksi}
      {ikon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d1d20] text-teks-redup">
          {ikon}
        </div>
      )}
    </div>
  );
}

export function KartuStat({
  label,
  nilai,
  keterangan,
  ikon,
  hijau = false,
}: {
  label: string;
  nilai: string;
  keterangan: string;
  ikon: ReactNode;
  hijau?: boolean;
}) {
  return (
    <div className="kartu flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-teks-redup">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d1d20] text-teks-redup">
          {ikon}
        </div>
      </div>
      <div>
        <p className={`text-[28px] font-bold leading-none ${hijau ? "text-hijau" : ""}`}>
          {nilai}
        </p>
        <p className="mt-2 text-[12px] text-teks-samar">{keterangan}</p>
      </div>
    </div>
  );
}

export function Bar({ rasio }: { rasio: number }) {
  const lebar = Math.max(0, Math.min(1, rasio)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#232327]">
      <div className="h-full rounded-full bg-[#5a5a62]" style={{ width: `${lebar}%` }} />
    </div>
  );
}

export function Kosong({ pesan }: { pesan: string }) {
  return (
    <p className="rounded-xl border border-dashed border-garis py-8 text-center text-[13px] text-teks-samar">
      {pesan}
    </p>
  );
}

export function Tombol({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`rounded-xl bg-[#1f1f23] px-4 py-2.5 text-[14px] font-semibold text-teks transition-colors hover:bg-[#2a2a30] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-[13px] text-teks-redup">{children}</span>;
}

const inputCls =
  "w-full rounded-xl border border-garis bg-[#0f0f11] px-3.5 py-2.5 text-[15px] text-teks outline-none placeholder:text-teks-samar focus:border-[#3a3a42]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Pesan({ teks, jenis }: { teks?: string; jenis: "ok" | "galat" }) {
  if (!teks) return null;
  return (
    <p
      className={`rounded-xl px-4 py-3 text-[14px] ${
        jenis === "ok"
          ? "bg-hijau-tua/30 text-hijau"
          : "bg-merah/15 text-merah"
      }`}
    >
      {teks}
    </p>
  );
}
