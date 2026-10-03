import assert from "node:assert/strict";
import test from "node:test";
import { nomorDari, parseAngka, pecahPerintah, urai } from "../src/lib/telegram/parse";
import { hanyaGrade } from "../src/lib/telegram/parse";

test("parseAngka menerima gaya penulisan Indonesia", () => {
  assert.equal(parseAngka("2000"), 2000);
  assert.equal(parseAngka("150.000"), 150000);
  assert.equal(parseAngka("150rb"), 150000);
  assert.equal(parseAngka("150 rb"), 150000);
  assert.equal(parseAngka("1,5jt"), 1500000);
  assert.equal(parseAngka("Rp2000"), 2000);
  assert.equal(parseAngka("abc"), null);
});

test("pecahPerintah memisahkan perintah dan argumen", () => {
  assert.deepEqual(pecahPerintah("/stok"), { perintah: "stok", argumen: "" });
  assert.deepEqual(pecahPerintah("/produksi A=50 B=45"), {
    perintah: "produksi",
    argumen: "A=50 B=45",
  });
  // perintah di grup membawa @namabot
  assert.equal(pecahPerintah("/stok@zenofarm_bot").perintah, "stok");
});

test("urai membaca penugasan sederhana", () => {
  const u = urai("A=50 B=45 C=45");
  assert.deepEqual(
    u.penugasan.map((p) => [p.kunci, p.jumlah]),
    [["A", 50], ["B", 45], ["C", 45]],
  );
  assert.equal(u.sisaTeks, "");
});

test("urai membaca bentuk tanpa tanda sama dengan", () => {
  const u = urai("A 50 B 45");
  assert.deepEqual(
    u.penugasan.map((p) => [p.kunci, p.jumlah]),
    [["A", 50], ["B", 45]],
  );
});

test("urai membaca harga setelah @", () => {
  const u = urai("Pak Budi | A=20@2000 AB=30@1700");
  assert.equal(u.sisaTeks, "Pak Budi");
  assert.deepEqual(
    u.penugasan.map((p) => [p.kunci, p.jumlah, p.harga]),
    [["A", 20, 2000], ["AB", 30, 1700]],
  );
});

test("urai menangkap nama pembeli tanpa tanda pemisah", () => {
  const u = urai("A=20@2000 Pak Budi");
  assert.equal(u.sisaTeks, "Pak Budi");
  assert.equal(u.penugasan.length, 1);
});

test("urai mengambil tanggal dari token tgl=", () => {
  const u = urai("A=40 AB=50 tgl=2026-09-16");
  assert.equal(u.tanggal, "2026-09-16");
  assert.equal(u.penugasan.length, 2);
});

test("urai memahami harga bergaya 2rb", () => {
  const u = urai("A=20@2rb");
  assert.equal(u.penugasan[0].harga, 2000);
});

test("hanyaGrade membuang kunci yang bukan grade telur", () => {
  const u = urai("A=10 AB=5 XX=3");
  const g = hanyaGrade(u.penugasan);
  assert.deepEqual(g.map((x) => x.grade), ["A", "AB"]);
});

test("hanyaGrade tidak peduli huruf besar kecil", () => {
  const u = urai("ab=5 b=3");
  assert.deepEqual(hanyaGrade(u.penugasan).map((x) => x.grade), ["AB", "B"]);
});

test("pengeluaran: token pertama nominal, sisanya keterangan", () => {
  const u = urai("150rb pakan 2 karung");
  // "2" sendirian tidak membentuk penugasan tanpa huruf di depannya
  assert.equal(u.penugasan.length, 0);
  assert.equal(u.sisaTeks, "150rb pakan 2 karung");
});

test("kata biasa dalam keterangan tidak tertelan jadi penugasan", () => {
  // "gas 2" dulu terbaca sebagai penugasan dan merusak keterangan.
  const u = urai("50rb gas 2 tabung");
  assert.equal(u.penugasan.length, 0);
  assert.equal(u.sisaTeks, "50rb gas 2 tabung");
});

test("teksMentah mempertahankan keterangan apa adanya", () => {
  // "b 3" cocok dengan bentuk longgar, tapi /keluar membaca teksMentah
  // sehingga keterangannya tetap utuh.
  const u = urai("50rb beli b 3 karung");
  assert.equal(u.teksMentah, "50rb beli b 3 karung");
});

test("teksMentah membuang token tanggal saja", () => {
  const u = urai("150rb pakan tgl=2026-09-16");
  assert.equal(u.teksMentah, "150rb pakan");
  assert.equal(u.tanggal, "2026-09-16");
});

test("bentuk longgar tetap jalan untuk grade dan kandang", () => {
  assert.deepEqual(
    urai("A 50 B 45").penugasan.map((p) => [p.kunci, p.jumlah]),
    [["A", 50], ["B", 45]],
  );
  assert.deepEqual(
    urai("AB 12").penugasan.map((p) => [p.kunci, p.jumlah]),
    [["AB", 12]],
  );
});

test("nomorDari membaca nomor baris untuk /batal", () => {
  assert.equal(nomorDari("3"), 3);
  assert.equal(nomorDari(" 10 "), 10);
  assert.equal(nomorDari("#2"), 2);
  assert.equal(nomorDari("2 salah ketik"), 2);
  assert.equal(nomorDari(""), null);
  assert.equal(nomorDari("0"), null);
  assert.equal(nomorDari("terakhir"), null);
  // Bukan nomor baris: angka yang menempel ke kata lain.
  assert.equal(nomorDari("3x"), null);
});

test("/batal tanpa angka tidak meninggalkan sisa yang bikin salah baca", () => {
  assert.deepEqual(pecahPerintah("/batal"), { perintah: "batal", argumen: "" });
  assert.equal(nomorDari(urai("").teksMentah), null);
  assert.equal(nomorDari(urai("3").teksMentah), 3);
});
