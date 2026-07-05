-- Create districts table
create table public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Create mandals table
create table public.mandals (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(district_id, name)
);

-- Create villages table
create table public.villages (
  id uuid primary key default gen_random_uuid(),
  mandal_id uuid not null references public.mandals(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(mandal_id, name)
);

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('citizen','operator','admin')),
  district_id uuid null references public.districts(id),
  mandal_id uuid null references public.mandals(id),
  village_id uuid null references public.villages(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Citizen'), coalesce(new.raw_user_meta_data->>'role', 'citizen'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create services table
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  required_documents jsonb default '[]'::jsonb,
  stages jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create service_requests table
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  status text not null default 'pending' check (status in ('pending','assigned','in_progress','completed','cancelled')),
  assigned_operator_id uuid null references public.profiles(id),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_service_requests_citizen on public.service_requests(citizen_id, created_at desc);
create index idx_service_requests_operator on public.service_requests(assigned_operator_id, status);
create index idx_service_requests_status on public.service_requests(status, created_at desc);

-- Create documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes int not null,
  status text not null default 'uploaded' check (status in ('uploaded','reviewed','rejected')),
  created_at timestamptz default now()
);
create index idx_documents_request on public.documents(request_id, created_at desc);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz null,
  created_at timestamptz default now()
);
create index idx_messages_request on public.messages(request_id, created_at asc);

-- Create payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  stage text not null,
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),
  provider_ref text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_payments_request on public.payments(request_id, stage);

-- Create audit_logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_audit_logs_target on public.audit_logs(target_type, target_id, created_at desc);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_requests enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: Users read own, Admins read/update all
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Admins update all profiles" on public.profiles for update using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Services: Everyone reads, Admins write
create policy "Everyone reads active services" on public.services for select using (is_active = true);
create policy "Admins manage services" on public.services for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Service Requests:
create policy "Citizens read/write own requests" on public.service_requests for all using (citizen_id = auth.uid());
create policy "Operators read assigned requests" on public.service_requests for select using (assigned_operator_id = auth.uid());
create policy "Admins manage all requests" on public.service_requests for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Documents:
create policy "Citizen read/write own documents" on public.documents for all using ((select citizen_id from public.service_requests where id = request_id) = auth.uid());
create policy "Operators read assigned documents" on public.documents for select using ((select assigned_operator_id from public.service_requests where id = request_id) = auth.uid());
create policy "Admins manage all documents" on public.documents for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Messages:
create policy "Citizen read/write own messages" on public.messages for all using ((select citizen_id from public.service_requests where id = request_id) = auth.uid());
create policy "Operators read assigned messages" on public.messages for select using ((select assigned_operator_id from public.service_requests where id = request_id) = auth.uid());
create policy "Admins manage all messages" on public.messages for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Payments:
create policy "Citizen read own payments" on public.payments for select using ((select citizen_id from public.service_requests where id = request_id) = auth.uid());
create policy "Operators read assigned payments" on public.payments for select using ((select assigned_operator_id from public.service_requests where id = request_id) = auth.uid());
create policy "Admins manage all payments" on public.payments for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Audit logs: Admins read only
create policy "Admins read audit logs" on public.audit_logs for select using ((select role from public.profiles where id = auth.uid()) = 'admin');
