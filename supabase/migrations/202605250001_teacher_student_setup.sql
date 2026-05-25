create table if not exists public.teacher_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_setups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  student_name text not null,
  hebrew_name text,
  father_name text,
  mother_name text,
  lineage text not null default 'Yisrael'
    check (lineage in ('Cohen', 'Levi', 'Yisrael')),
  bar_mitzvah_date date,
  service_time text not null default 'morning'
    check (service_time in ('morning', 'afternoon')),
  section_type text not null default 'maftir'
    check (section_type in ('maftir', 'haftarah', 'custom_aliyah')),
  custom_aliyah text,
  text_reference text,
  parasha_confirmed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_sections (
  id uuid primary key default gen_random_uuid(),
  student_setup_id uuid not null references public.student_setups(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  title text not null,
  text_reference text not null,
  hebrew_text text,
  transliteration text,
  guide_audio_url text,
  source_attribution jsonb not null default '{}'::jsonb,
  timing_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_student_messages (
  id uuid primary key default gen_random_uuid(),
  student_setup_id uuid not null references public.student_setups(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.teacher_profiles enable row level security;
alter table public.student_setups enable row level security;
alter table public.practice_sections enable row level security;
alter table public.teacher_student_messages enable row level security;

drop policy if exists "Teachers manage own profile" on public.teacher_profiles;
create policy "Teachers manage own profile"
on public.teacher_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Teachers manage own student setups" on public.student_setups;
create policy "Teachers manage own student setups"
on public.student_setups
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "Teachers manage own practice sections" on public.practice_sections;
create policy "Teachers manage own practice sections"
on public.practice_sections
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "Teachers manage own student messages" on public.teacher_student_messages;
create policy "Teachers manage own student messages"
on public.teacher_student_messages
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);
