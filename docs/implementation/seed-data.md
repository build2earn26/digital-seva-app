# Seed Data Plan

## First admin
- Create via Supabase Auth signup in production or local CLI.
- After signup, insert into `profiles` with `role = 'admin'`.
- Guard the `/signup` API route so new signups default to `citizen` unless seeded by an existing admin invite flow.
- Document the manual bootstrap command or SQL for first admin creation.

## Pilot locations
Use a small fixed pilot set until admin UI is available.

**Districts**
- East Godavari

**Mandals**
- Peddapuram
- Samalkota

**Villages**
- Peddapuram: Peddapuram, Divipalli
- Samalkota: Samalkota, Virava

Seed via idempotent SQL/migration so staging and production can re-run safely.

## Services
Seed 3–5 records for pilot testing.

1. **Birth Certificate**
   - Documents: Aadhaar, hospital receipt
   - Stages: apply, review, issue
2. **Income Certificate**
   - Documents: Aadhaar, employer letter
   - Stages: apply, verify, issue
3. **Caste Certificate**
   - Documents: Aadhaar, prior certificate
   - Stages: apply, review, issue

Use explicit stage order from service metadata so the frontend and payment flow stay aligned.

## Runbook
- CI or local script seeds pilot data after migrations.
- Do not ship with empty tables in staging.
- Production seeding requires admin authentication boundary.
