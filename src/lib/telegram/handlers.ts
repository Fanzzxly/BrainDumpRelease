import {
  AturanBisnisError,
  catatAfkir,
  catatKlasifikasi,
  catatPemakaian,
  catatPengeluaran,
  catatPenjualan,
  catatProduksi,
  getKandang,
  getRingkasan,
  getStok,
  type ItemJual,
} from "../queries";
import { angka, hariIni, rupiah, tanggalPanjang } from "../format";
import { hanyaGrade, parseAngka, pecahPerintah, urai } from "./parse";

/**
 * Balasan dikirim dengan parse_mode HTML, jadi teks dari pengguna
 * (nama pembeli, keterangan) harus di-escape dulu supaya tanda < & >
 * tidak merusak pesan - atau membuat Telegram menolak mengirimnya.
 */
function esc(teks: string): string {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const BANTUAN = `<b>ZENOFARM</b> — catat usaha dari Telegram.

<b>Produksi &amp; grade</b>
<code>/produksi A=50 B=45 C=45</code>
<code>/grade A=40 AB=50 B=30</code>
Grade C otomatis dari sisa produksi hari itu. Mau tulis sendiri: tambah <code>C=20</code>.

<b>Penjualan</b>
<code>/jual Pak Budi | A=20@2000 AB=30@1700</code>
Nama pembeli di kiri tanda <code>|</code>, rincian grade di kanan.

<b>Pengeluaran</b>
<code>/keluar 150rb pakan 2 karung</code>

<b>Pemakaian &amp; afkir</b>
<code>/pakai AB=2 digoreng</code>
<code>/afkir A=1 sakit</code>

<b>Lihat data</b>
<code>/stok</code> — stok telur per grade
<code>/ringkasan</code> — produksi, kas, populasi

<b>Tanggal lain</b>
Tambahkan <code>tgl=2026-09-16</code> di perintah mana pun.`;

function ringkasPenugasanKosong(contoh: string): string {
  return `Formatnya belum lengkap. Contoh:\n<code>${contoh}</code>\n\nKetik /bantuan untuk daftar lengkap.`;
}

export async function tanganiPerintah(teks: string): Promise<string> {
  const { perintah, argumen } = pecahPerintah(teks);
  const u = urai(argumen);
  const tanggal = u.tanggal ?? hariIni();

  switch (perintah) {
    // ------------------------------------------------------------ bantuan
    case "":
    case "start":
    case "mulai":
    case "help":
    case "bantuan":
      return BANTUAN;

    // ------------------------------------------------------------ produksi
    case "produksi": {
      if (u.penugasan.length === 0)
        return ringkasPenugasanKosong("/produksi A=50 B=45 C=45");

      const kandang = await getKandang();
      const sah = new Set(kandang.map((k) => k.id));
      const tidakDikenal = u.penugasan.filter((p) => !sah.has(p.kunci));
      if (tidakDikenal.length > 0)
        return `Kandang tidak dikenal: ${esc(
          tidakDikenal.map((p) => p.kunci).join(", "),
        )}. Kandang tersedia: ${[...sah].join(", ")}.`;

      let total = 0;
      for (const p of u.penugasan) {
        await catatProduksi(tanggal, p.kunci, p.jumlah);
        total += p.jumlah;
      }
      const rincian = u.penugasan.map((p) => `${p.kunci} ${p.jumlah}`).join(" · ");
      return `✅ Produksi ${tanggalPanjang(tanggal)} tersimpan.\n${rincian}\n<b>Total ${angka(total)} butir</b>\n\nLanjut klasifikasi: <code>/grade A=.. AB=.. B=..</code>`;
    }

    // ------------------------------------------------------------ klasifikasi
    case "grade":
    case "klasifikasi": {
      const g = hanyaGrade(u.penugasan);
      if (g.length === 0) return ringkasPenugasanKosong("/grade A=40 AB=50 B=30");

      const ambil = (nama: string) => g.find((x) => x.grade === nama)?.jumlah ?? 0;
      const adaC = g.some((x) => x.grade === "C");
      const hasil = await catatKlasifikasi(tanggal, {
        a: ambil("A"),
        ab: ambil("AB"),
        b: ambil("B"),
        c: adaC ? ambil("C") : undefined,
      });
      return `✅ Klasifikasi ${tanggalPanjang(tanggal)} tersimpan.\nA ${hasil.a} · AB ${hasil.ab} · B ${hasil.b} · C ${hasil.c}\n<b>Total ${angka(hasil.total)} butir</b>${
        adaC ? "" : "\n<i>Grade C dihitung dari sisa produksi hari itu.</i>"
      }`;
    }

    // ------------------------------------------------------------ penjualan
    case "jual":
    case "penjualan": {
      const g = hanyaGrade(u.penugasan);
      if (g.length === 0)
        return ringkasPenugasanKosong("/jual Pak Budi | A=20@2000 AB=30@1700");

      const tanpaHarga = g.filter((x) => x.harga === undefined);
      if (tanpaHarga.length > 0)
        return `Harga grade ${tanpaHarga
          .map((x) => x.grade)
          .join(", ")} belum diisi. Tulis dengan tanda @, contoh <code>A=20@2000</code>.`;

      const items: ItemJual[] = g.map((x) => ({
        grade: x.grade,
        jumlah: x.jumlah,
        harga: x.harga!,
      }));
      const pembeli = u.sisaTeks;
      const hasil = await catatPenjualan(tanggal, pembeli, items);
      const rincian = items
        .map((i) => `${i.grade} ${i.jumlah} × ${rupiah(i.harga)} = ${rupiah(i.jumlah * i.harga)}`)
        .join("\n");
      return `✅ Penjualan tersimpan${pembeli ? ` — <b>${esc(pembeli)}</b>` : ""}.\n${rincian}\n<b>Total ${angka(hasil.butir)} butir · ${rupiah(hasil.total)}</b>`;
    }

    // ------------------------------------------------------------ pengeluaran
    case "keluar":
    case "pengeluaran": {
      const token = u.teksMentah.split(/\s+/).filter(Boolean);
      if (token.length === 0) return ringkasPenugasanKosong("/keluar 150rb pakan 2 karung");

      const nominal = parseAngka(token[0]);
      if (nominal === null)
        return `Nominal "${esc(token[0])}" tidak terbaca. Contoh yang bisa: <code>150000</code>, <code>150rb</code>, <code>1,5jt</code>.`;

      const keterangan = token.slice(1).join(" ");
      if (!keterangan)
        return "Keterangannya apa? Contoh: <code>/keluar 150rb pakan 2 karung</code>.";

      await catatPengeluaran(tanggal, keterangan, nominal);
      return `✅ Pengeluaran tersimpan.\n${esc(keterangan)}\n<b>${rupiah(nominal)}</b> · ${tanggalPanjang(tanggal)}`;
    }

    // ------------------------------------------------------------ pemakaian
    case "pakai":
    case "pemakaian": {
      const g = hanyaGrade(u.penugasan);
      if (g.length === 0) return ringkasPenugasanKosong("/pakai AB=2 digoreng");

      const baris: string[] = [];
      for (const x of g) {
        const hasil = await catatPemakaian(tanggal, x.grade, x.jumlah, u.sisaTeks);
        baris.push(`${x.grade} −${x.jumlah} butir · sisa ${angka(hasil.sisaBaru)}`);
      }
      return `✅ Pemakaian tersimpan${u.sisaTeks ? ` (${esc(u.sisaTeks)})` : ""}.\n${baris.join("\n")}`;
    }

    // ------------------------------------------------------------ afkir
    case "afkir": {
      if (u.penugasan.length === 0) return ringkasPenugasanKosong("/afkir A=1 sakit");

      const kandang = await getKandang();
      const sah = new Set(kandang.map((k) => k.id));
      const baris: string[] = [];
      for (const p of u.penugasan) {
        if (!sah.has(p.kunci))
          return `Kandang "${esc(p.kunci)}" tidak dikenal. Tersedia: ${[...sah].join(", ")}.`;
        await catatAfkir(tanggal, p.kunci, p.jumlah, u.sisaTeks);
        baris.push(`Kandang ${p.kunci} −${p.jumlah} ekor`);
      }
      const sesudah = await getKandang();
      const populasi = sesudah.filter((k) => k.aktif).reduce((s, k) => s + k.populasi, 0);
      return `✅ Afkir tersimpan${u.sisaTeks ? ` (${esc(u.sisaTeks)})` : ""}.\n${baris.join("\n")}\n<b>Populasi sekarang ${angka(populasi)} ekor</b>`;
    }

    // ------------------------------------------------------------ lihat data
    case "stok": {
      const stok = await getStok();
      const baris = stok
        .map((s) => `Grade ${s.grade.padEnd(2)} — <b>${angka(s.sisa)}</b> butir`)
        .join("\n");
      const total = stok.reduce((s, g) => s + g.sisa, 0);
      return `<b>Stok telur</b>\n${baris}\n\nTotal <b>${angka(total)} butir</b>`;
    }

    case "ringkasan":
    case "lapor": {
      const r = await getRingkasan();
      const stok = r.stok.map((s) => `${s.grade} ${angka(s.sisa)}`).join(" · ");
      return [
        `<b>Ringkasan ${tanggalPanjang(r.tanggal)}</b>`,
        ``,
        `Populasi: <b>${angka(r.populasi)} ekor</b> (${r.kandangAktif} kandang)`,
        `Produksi hari ini: <b>${angka(r.produksiHariIni)} butir</b> (${r.persenProduksi.toFixed(0)}%)`,
        `Stok: ${stok}`,
        `Total stok: <b>${angka(r.totalStok)} butir</b>`,
        ``,
        `Pemasukan: <b>${rupiah(r.keuangan.pemasukan)}</b>`,
        `Pengeluaran: <b>${rupiah(r.keuangan.pengeluaran)}</b>`,
        `Laba: <b>${rupiah(r.keuangan.laba)}</b>`,
      ].join("\n");
    }

    default:
      return `Perintah <code>/${esc(perintah)}</code> tidak dikenal.\n\n${BANTUAN}`;
  }
}

/** Bungkus handler supaya error apa pun tetap jadi balasan yang bisa dibaca. */
export async function balasUntuk(teks: string): Promise<string> {
  try {
    return await tanganiPerintah(teks);
  } catch (e) {
    if (e instanceof AturanBisnisError) return `⚠️ ${e.message}`;
    console.error("handler telegram gagal", e);
    return "⚠️ Ada gangguan saat menyimpan. Coba lagi sebentar lagi.";
  }
}
