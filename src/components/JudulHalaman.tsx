export default function JudulHalaman({
  eyebrow,
  judul,
  deskripsi,
}: {
  eyebrow: string;
  judul: string;
  deskripsi: string;
}) {
  return (
    <header>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-[34px] font-bold leading-tight">{judul}</h1>
      <p className="mt-2 text-[15px] text-teks-redup">{deskripsi}</p>
    </header>
  );
}
