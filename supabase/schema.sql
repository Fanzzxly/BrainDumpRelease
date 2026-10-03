-- =====================================================================
-- ZENOFARM - skema database (PostgreSQL / Supabase)
-- Jalankan sekali di Supabase SQL Editor.
-- =====================================================================

-- ---------- Kandang & populasi ----------
create table if not exists kandang (
  id            text primary key,                 -- 'A', 'B', 'C'
  nama          text not null,
  populasi_awal int  not null default 0 check (populasi_awal >= 0),
  aktif         boolean not null default true,
  urutan        int  not null default 0
);

-- ---------- Produksi harian per kandang ----------
create table if not exists produksi (
  id            bigserial primary key,
  tanggal       date not null,
  kandang_id    text not null references kandang(id) on delete cascade,
  jumlah        int  not null check (jumlah >= 0),
  dicatat_pada  timestamptz not null default now(),
  unique (tanggal, kandang_id)                     -- satu catatan per kandang per hari
);
create index if not exists produksi_tanggal_idx on produksi (tanggal desc);

-- ---------- Klasifikasi grade (telur 3 kandang digabung lalu diukur) ----------
create table if not exists klasifikasi (
  id            bigserial primary key,
  tanggal       date not null unique,
  grade_a       int not null default 0 check (grade_a  >= 0),
  grade_ab      int not null default 0 check (grade_ab >= 0),
  grade_b       int not null default 0 check (grade_b  >= 0),
  grade_c       int not null default 0 check (grade_c  >= 0),
  dicatat_pada  timestamptz not null default now()
);
create index if not exists klasifikasi_tanggal_idx on klasifikasi (tanggal desc);

-- ---------- Penjualan (1 nota bisa memuat banyak grade) ----------
create table if not exists penjualan (
  id            bigserial primary key,
  tanggal       date not null,
  pembeli       text not null default '',
  catatan       text,
  dicatat_pada  timestamptz not null default now()
);
create index if not exists penjualan_tanggal_idx on penjualan (tanggal desc);

create table if not exists penjualan_item (
  id            bigserial primary key,
  penjualan_id  bigint not null references penjualan(id) on delete cascade,
  grade         text   not null check (grade in ('A','AB','B','C')),
  jumlah        int    not null check (jumlah > 0),
  harga_satuan  numeric(12,2) not null check (harga_satuan >= 0)
);
create index if not exists penjualan_item_penjualan_idx on penjualan_item (penjualan_id);

-- ---------- Pengeluaran (keterangan bebas) ----------
create table if not exists pengeluaran (
  id            bigserial primary key,
  tanggal       date not null,
  keterangan    text not null,
  jumlah        numeric(14,2) not null check (jumlah >= 0),
  dicatat_pada  timestamptz not null default now()
);
create index if not exists pengeluaran_tanggal_idx on pengeluaran (tanggal desc);

-- ---------- Pemakaian telur sendiri / pecah ----------
create table if not exists pemakaian_telur (
  id            bigserial primary key,
  tanggal       date not null,
  grade         text not null check (grade in ('A','AB','B','C')),
  jumlah        int  not null check (jumlah > 0),
  keterangan    text,
  dicatat_pada  timestamptz not null default now()
);
create index if not exists pemakaian_telur_tanggal_idx on pemakaian_telur (tanggal desc);

-- ---------- Afkir bebek (mengurangi populasi) ----------
create table if not exists afkir (
  id            bigserial primary key,
  tanggal       date not null,
  kandang_id    text references kandang(id) on delete set null,
  jumlah        int  not null check (jumlah > 0),
  keterangan    text,
  dicatat_pada  timestamptz not null default now()
);
create index if not exists afkir_tanggal_idx on afkir (tanggal desc);

-- =====================================================================
-- VIEW turunan
--
-- security_invoker = true WAJIB di sini. Tanpa itu view dijalankan dengan
-- hak pemiliknya (postgres), sehingga RLS tabel di bawahnya dilewati dan
-- siapa pun yang memegang publishable key bisa membaca stok serta omzet
-- lewat view ini. Supabase menandai view semacam itu "UNRESTRICTED".
-- =====================================================================

-- Stok telur per grade = masuk (klasifikasi) - terjual - terpakai
create or replace view stok_telur with (security_invoker = true) as
with masuk as (
  select 'A'  as grade, coalesce(sum(grade_a), 0)::bigint  as jumlah from klasifikasi
  union all
  select 'AB', coalesce(sum(grade_ab), 0)::bigint from klasifikasi
  union all
  select 'B',  coalesce(sum(grade_b), 0)::bigint  from klasifikasi
  union all
  select 'C',  coalesce(sum(grade_c), 0)::bigint  from klasifikasi
),
terjual as (
  select grade, coalesce(sum(jumlah), 0)::bigint as jumlah
  from penjualan_item group by grade
),
terpakai as (
  select grade, coalesce(sum(jumlah), 0)::bigint as jumlah
  from pemakaian_telur group by grade
)
select
  m.grade,
  m.jumlah                                                            as masuk,
  coalesce(t.jumlah, 0)                                               as terjual,
  coalesce(p.jumlah, 0)                                               as terpakai,
  m.jumlah - coalesce(t.jumlah, 0) - coalesce(p.jumlah, 0)            as sisa
from masuk m
left join terjual  t on t.grade = m.grade
left join terpakai p on p.grade = m.grade;

-- Populasi aktual per kandang = populasi awal - afkir
create or replace view populasi_kandang with (security_invoker = true) as
select
  k.id,
  k.nama,
  k.populasi_awal,
  coalesce(a.jumlah, 0)                        as total_afkir,
  k.populasi_awal - coalesce(a.jumlah, 0)      as populasi,
  k.aktif,
  k.urutan
from kandang k
left join (
  select kandang_id, sum(jumlah)::bigint as jumlah from afkir group by kandang_id
) a on a.kandang_id = k.id;

-- Nilai total tiap nota penjualan
create or replace view penjualan_total with (security_invoker = true) as
select
  p.id,
  p.tanggal,
  p.pembeli,
  p.catatan,
  p.dicatat_pada,
  coalesce(sum(i.jumlah), 0)::bigint                  as total_butir,
  coalesce(sum(i.jumlah * i.harga_satuan), 0)::numeric as total_rp
from penjualan p
left join penjualan_item i on i.penjualan_id = p.id
group by p.id;

-- =====================================================================
-- Keamanan: RLS menyala tanpa policy.
-- Aplikasi memakai service_role key (server-side) yang melewati RLS.
-- Anon key tidak bisa membaca apa pun.
-- =====================================================================
alter table kandang          enable row level security;
alter table produksi         enable row level security;
alter table klasifikasi      enable row level security;
alter table penjualan        enable row level security;
alter table penjualan_item   enable row level security;
alter table pengeluaran      enable row level security;
alter table pemakaian_telur  enable row level security;
alter table afkir            enable row level security;

-- =====================================================================
-- Data awal: 3 kandang, total 200 ekor
-- Sesuaikan angkanya dengan kondisi kandangmu.
-- =====================================================================
insert into kandang (id, nama, populasi_awal, aktif, urutan) values
  ('A', 'Kandang A', 70, true, 1),
  ('B', 'Kandang B', 70, true, 2),
  ('C', 'Kandang C', 60, true, 3)
on conflict (id) do nothing;
