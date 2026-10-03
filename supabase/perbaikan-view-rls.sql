-- =====================================================================
-- Perbaikan untuk database yang sudah terlanjur dibuat dengan versi
-- schema.sql sebelumnya.
--
-- Masalah: view dibuat tanpa security_invoker, jadi dijalankan dengan hak
-- pemiliknya dan melewati RLS tabel di bawahnya. Akibatnya pemegang
-- publishable key (yang memang bersifat publik) bisa membaca stok telur,
-- populasi, dan total penjualan. Supabase menandainya "UNRESTRICTED" di
-- Table Editor.
--
-- Jalankan sekali di Supabase SQL Editor. Aman diulang.
-- Butuh PostgreSQL 15 atau lebih baru (semua project Supabase baru sudah).
-- =====================================================================

alter view stok_telur       set (security_invoker = true);
alter view populasi_kandang set (security_invoker = true);
alter view penjualan_total  set (security_invoker = true);

-- Verifikasi: ketiganya harus mengembalikan security_invoker=true
select c.relname as view,
       c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('stok_telur', 'populasi_kandang', 'penjualan_total');
