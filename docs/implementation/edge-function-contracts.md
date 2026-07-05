# Minimal Edge Function Contract List — Phase 1

Use these contracts only. Keep client-side API calls limited to these boundaries.

## 1. Request lifecycle
`POST /functions/v1/requests`
- Create request
- Auth: citizen only
- Body: `service_id`, `metadata`
- Response: `request_id`, `status`, `created_at`

`PATCH /functions/v1/requests/:id/assign`
- Atomic operator assignment
- Auth: operator/admin only
- Response: `request_id`, `assigned_operator_id`, `status`

`PATCH /functions/v1/requests/:id/status`
- Status transition
- Auth: operator/admin only
- Body: `status`, `note`
- Response: `request_id`, `status`, `updated_at`

## 2. Documents
`POST /functions/v1/documents/presign`
- Return signed upload URL
- Auth: citizen/operator only
- Body: `request_id`, `file_name`, `mime_type`, `size_bytes`
- Response: `upload_url`, `path`, `expires_at`

`POST /functions/v1/documents/confirm`
- Confirm upload and save metadata
- Auth: citizen/operator only
- Body: `request_id`, `path`, `file_name`, `mime_type`, `size_bytes`
- Response: `document_id`, `status`

## 3. Chat
Realtime channel is scoped by `request_id`.
- Client joins channel `request:{request_id}`
- Only participants verified by RLS may read/write
- Server-side validation remains in RLS and Supabase Realtime rules

## 4. Payments
`POST /functions/v1/payments/init`
- Initiate staged payment for request
- Auth: citizen only
- Body: `request_id`, `stage`
- Response: `payment_id`, `status`, `provider_state`

`POST /functions/v1/payments/webhook`
- Accept provider callback or mock callback
- Auth: service role only
- Body: `payment_id`, `status`, `provider_ref`
- Response: `payment_id`, `status`

## 5. Admin utilities
`POST /functions/v1/admin/seed-pilot`
- Seed pilot locations and services
- Auth: admin only
- Response: `seeded_count`

---

## Notes
- Do not add client-side secrets.
- Prefer Supabase client SDK for auth + database reads.
- Use Edge Functions only for mutations, presigned operations, and webhooks.
- Keep response shapes small and typed.
