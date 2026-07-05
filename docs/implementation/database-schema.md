# Database Schema and RLS Policy Outline

## Schema

### profiles
- `id uuid primary key references auth.users(id) on delete cascade`
- `full_name text not null`
- `phone text`
- `role text not null check (role in ('citizen','operator','admin'))`
- `district_id uuid null references districts(id)`
- `mandal_id uuid null references mandals(id)`
- `village_id uuid null references villages(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### districts
- `id uuid primary key default gen_random_uuid()`
- `name text not null unique`
- `created_at timestamptz default now()`

### mandals
- `id uuid primary key default gen_random_uuid()`
- `district_id uuid not null references districts(id) on delete cascade`
- `name text not null`
- `created_at timestamptz default now()`
- Unique: `(district_id, name)`

### villages
- `id uuid primary key default gen_random_uuid()`
- `mandal_id uuid not null references mandals(id) on delete cascade`
- `name text not null`
- `created_at timestamptz default now()`
- Unique: `(mandal_id, name)`

### services
- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `description text`
- `required_documents jsonb default '[]'::jsonb`
- `stages jsonb not null default '[]'::jsonb`
- `is_active boolean not null default true`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### service_requests
- `id uuid primary key default gen_random_uuid()`
- `citizen_id uuid not null references profiles(id) on delete cascade`
- `service_id uuid not null references services(id)`
- `status text not null default 'pending' check (status in ('pending','assigned','in_progress','completed','cancelled'))`
- `assigned_operator_id uuid null references profiles(id)`
- `payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded'))`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- Index: `(citizen_id, created_at desc)`
- Index: `(assigned_operator_id, status)`
- Index: `(status, created_at desc)`

### documents
- `id uuid primary key default gen_random_uuid()`
- `request_id uuid not null references service_requests(id) on delete cascade`
- `uploaded_by uuid not null references profiles(id) on delete cascade`
- `path text not null`
- `file_name text not null`
- `mime_type text not null`
- `size_bytes int not null`
- `status text not null default 'uploaded' check (status in ('uploaded','reviewed','rejected'))`
- `created_at timestamptz default now()`
- Index: `(request_id, created_at desc)`

### messages
- `id uuid primary key default gen_random_uuid()`
- `request_id uuid not null references service_requests(id) on delete cascade`
- `sender_id uuid not null references profiles(id) on delete cascade`
- `content text not null`
- `read_at timestamptz null`
- `created_at timestamptz default now()`
- Index: `(request_id, created_at asc)`

### payments
- `id uuid primary key default gen_random_uuid()`
- `request_id uuid not null references service_requests(id) on delete cascade`
- `stage text not null`
- `amount numeric not null check (amount >= 0)`
- `status text not null default 'pending' check (status in ('pending','succeeded','failed'))`
- `provider_ref text null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- Index: `(request_id, stage)`

### audit_logs
- `id uuid primary key default gen_random_uuid()`
- `actor_id uuid not null references profiles(id)`
- `action text not null`
- `target_type text not null`
- `target_id uuid not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz default now()`
- Index: `(target_type, target_id, created_at desc)`

---

## RLS Policy Outline

Enable RLS on all tables except `districts`, `mandals`, `villages`.

### profiles
- Users can read their own row.
- Admins can read and update any row.
- `role` updates are admin-only.

### services
- Everyone can read active services.
- Admin-only insert/update/delete.

### service_requests
- Citizen: read/create own requests; update only while non-terminal.
- Operator: read assigned requests; update status/operator only when assigned.
- Admin: read/update/delete any request.

### documents
- Citizen/operator: read/write documents on accessible requests only.
- Admin: read any document.

### messages
- Citizen/operator: read/write messages on accessible requests only.
- Admin: read any message.

### payments
- Citizen: read payments on own requests.
- Operator/admin: read/write payments on accessible requests.

### audit_logs
- Read: admin only.
- Insert: service role or trusted server-side function only.

---

## Notes
- Use `auth.uid()` everywhere for RLS.
- Prefer server-side Edge Functions for mutation-heavy or sensitive flows.
- Keep RLS simple in MVP; expand after security review.
