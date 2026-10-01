type P = { className?: string };
const base = "h-[18px] w-[18px]";

export const IkonRingkasan = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const IkonProduksi = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3.5" fill="currentColor" />
  </svg>
);

export const IkonStok = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 3.5 20 12l-8 8.5L4 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IkonPenjualan = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M5 19 19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 5h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IkonPemakaian = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M3 14c3.5-4 7-4 10.5-1 2 1.7 4.5 1.4 7.5-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IkonPengeluaran = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M19 5 5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 19H5v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IkonLaporan = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3.5" y="4" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 9h17M3.5 14.5h17" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export const IkonKandang = ({ className = base }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path d="M12 3.5 20 11v9.5H4V11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IkonTelur = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <ellipse cx="12" cy="13" rx="6" ry="8" fill="currentColor" />
  </svg>
);

export const IkonBebek = ({ className = "h-7 w-7" }: P) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
    <path
      d="M11 9.5a3.4 3.4 0 1 1 6.8 0v1.3h3.9c.6 0 .9.7.5 1.1l-2.2 2.2v2.6c0 3.9-3.2 7.1-7.1 7.1H7.6a.6.6 0 0 1-.4-1l3.6-3.6a6.6 6.6 0 0 1 .2-9.7Z"
      fill="currentColor"
    />
    <circle cx="14.6" cy="9.1" r="1" fill="#0b0b0c" />
  </svg>
);
