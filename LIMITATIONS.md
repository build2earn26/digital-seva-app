# Digital Seva MVP - Limitations & Acceptance Notes

This document outlines the known gaps, hardcoded mockups, and acceptance criteria verified during the MVP closeout and Citizen Dashboard phase.

## MVP Placeholders & Hardcoded Mockups
To maintain a lean MVP scope, the following features are intentionally stubbed or hardcoded:

1. **Nearby Service Centers (`center_id`)**: 
   The radio selection for service centers (e.g., "Peddapuram Secretariat #1") in the Apply flow is a frontend UI mockup. The selected `center_id` is successfully written to the `service_requests.metadata` JSONB column, but the list of centers is not dynamically queried from a geospatial table.
2. **Cascading Locations (Mandal / Village)**:
   While the `districts` dropdown dynamically fetches from the database, the dependent `mandal` and `village` dropdowns in the Apply form are hardcoded. A full implementation would require cascading AJAX/Server Actions to populate these based on the parent selection.
3. **Payments**:
   The payment gateway is a simulation. Clicking "Simulate Payment" successfully exercises the application state machine (updating the `payments` table status to 'succeeded' and attaching it to the request), but no external financial rail is integrated.

## Data Source Authenticity
- **My Transactions**:
  The `/citizen/transactions` view is strictly backed by the physical `public.payments` table using a relational join: `service_requests(citizen_id, services(title))`. It is **not** a derived state computed on the fly from service requests. Each transaction represents a distinct row in the `payments` table.
- **Audit Logs**:
  All audit logs (`public.audit_logs`) are append-only application records written by server-side logic (e.g., during payment state transitions). They are protected by an RLS policy that explicitly restricts writes from clients, preventing arbitrary user-generated log spoofing.

## End-to-End Verifications
- **Document Vault & Signed URLs**:
  The `/citizen/documents` upload and signed URL view flow is fully operational end-to-end. Documents are uploaded directly to Supabase Storage (`service_documents` bucket) via Server Actions, and temporary Signed URLs (valid for 1 hour) are securely generated for viewing/downloading in both the Vault and the Application Detail views.
- **Granular RLS Hardening**:
  The `documents` table is secured with split SELECT, INSERT, UPDATE, and DELETE policies. Writes explicitly enforce `WITH CHECK (uploaded_by = auth.uid())` to guarantee users can only create or modify their own files, even when `request_id IS NULL`.

## Configuration Prerequisites for Production (Vercel)
- **Google OAuth Redirect URIs**:
  For the Gmail-based sign-in flow to function correctly in production, the Google Cloud Console and Supabase Dashboard must be configured with the Vercel production URL (e.g., `https://digital-seva-app.vercel.app/auth/callback`) in the list of allowed Redirect URIs, alongside `http://localhost:3000/auth/callback` for local development.
