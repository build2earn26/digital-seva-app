-- Add fields needed for the rural-friendly application feed + smart sorting.
-- Computed "new this week" is derived from created_at at query time, so no flag column.

alter table public.services
  add column if not exists category text not null default 'general',
  add column if not exists subcategory text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists academic_track text not null default 'general'
    check (academic_track in ('general','school','higher_ed','vocational','skill','none')),
  add column if not exists popularity int not null default 0;

-- Indexes for feed filtering / sorting.
create index if not exists idx_services_category on public.services (category);
create index if not exists idx_services_academic_track on public.services (academic_track);
create index if not exists idx_services_popularity on public.services (popularity desc);
create index if not exists idx_services_created_at on public.services (created_at desc);
create index if not exists idx_services_tags on public.services using gin (tags);

-- Citizen academic status, used for profile-aligned feed sorting.
-- Default 'none' = "Not Applicable" so rural / non-academic users are never gated.
alter table public.profiles
  add column if not exists academic_track text not null default 'none'
  check (academic_track in ('none','school','higher_ed','vocational','skill','general'));
