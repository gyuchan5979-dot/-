-- 사용자 제보 저장용 테이블 (Supabase SQL Editor에 그대로 붙여 넣어 실행)
--
-- 앱(anon 키)은 아래만 할 수 있어요.
--   - place_reports:     "정보가 달라요" 신고 추가 (읽기 불가)
--   - place_submissions: 새 장소 제보 추가, 승인(approved)된 제보만 읽기
-- 승인·처리는 Supabase 대시보드(Table Editor)에서 status를 바꿔서 해요.

-- 서울 기준 오늘 날짜 (같은 사람이 하루에 같은 제보를 반복하지 못하게 하는 데 써요)
create or replace function public.seoul_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Seoul')::date $$;

-- 기존 가게 정보 신고
create table if not exists public.place_reports (
  id bigint generated always as identity primary key,
  place_id text not null check (char_length(place_id) between 1 and 64),
  place_name text check (char_length(place_name) <= 100),
  kind text not null check (kind in ('closed', 'not_allowed', 'wrong_info', 'other')),
  note text check (char_length(note) <= 300),
  reporter_key text not null check (char_length(reporter_key) between 8 and 128),
  status text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  created_day date not null default public.seoul_today(),
  created_at timestamptz not null default now(),
  unique (place_id, reporter_key, created_day)
);

-- 새 장소 제보
create table if not exists public.place_submissions (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  category text not null check (category in ('restaurant', 'cafe')),
  address text check (char_length(address) <= 120),
  lat double precision not null check (lat between 33 and 39),
  lng double precision not null check (lng between 124 and 132),
  pet_area text not null check (pet_area in ('indoor', 'terrace', 'partial', 'carrier', 'unknown')),
  large_dog_ok boolean not null default false,
  note text check (char_length(note) <= 300),
  reporter_key text not null check (char_length(reporter_key) between 8 and 128),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified_at date,
  created_day date not null default public.seoul_today(),
  created_at timestamptz not null default now(),
  unique (reporter_key, name, created_day)
);

create index if not exists place_submissions_approved_geo
  on public.place_submissions (lat, lng) where status = 'approved';

alter table public.place_reports enable row level security;
alter table public.place_submissions enable row level security;

-- Supabase는 기본으로 anon에 모든 권한을 주기 때문에 먼저 다 거두고, 필요한 컬럼만 열어요.
-- (status, created_day 같은 컬럼은 앱에서 넣을 수 없어요)
revoke all on public.place_reports, public.place_submissions from anon, authenticated;

grant insert (place_id, place_name, kind, note, reporter_key) on public.place_reports to anon, authenticated;
grant insert (name, category, address, lat, lng, pet_area, large_dog_ok, note, reporter_key)
  on public.place_submissions to anon, authenticated;
grant select (id, name, category, address, lat, lng, pet_area, large_dog_ok, verified_at, status)
  on public.place_submissions to anon, authenticated;

drop policy if exists "anyone can report" on public.place_reports;
create policy "anyone can report" on public.place_reports
  for insert to anon, authenticated with check (status = 'open');

drop policy if exists "anyone can submit" on public.place_submissions;
create policy "anyone can submit" on public.place_submissions
  for insert to anon, authenticated with check (status = 'pending');

drop policy if exists "approved are public" on public.place_submissions;
create policy "approved are public" on public.place_submissions
  for select to anon, authenticated using (status = 'approved');
