-- Migration for Citizen Dashboard & PWA UX

-- Add is_open and opening_time to services
ALTER TABLE public.services ADD COLUMN is_open boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN opening_time text;

-- Allow documents to be stored without a service request (Document Vault)
ALTER TABLE public.documents ALTER COLUMN request_id DROP NOT NULL;
