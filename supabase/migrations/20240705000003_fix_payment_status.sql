-- Fix: align service_requests.payment_status check constraint with the states
-- the payment actions actually set (payments.ts writes 'requested', 'pending',
-- 'cancelled' — none of which existed in the original constraint, causing
-- check-violation failures at runtime).
alter table public.service_requests
  drop constraint if exists service_requests_payment_status_check;

alter table public.service_requests
  add constraint service_requests_payment_status_check
  check (
    payment_status in (
      'unpaid',        -- initial state, no payment requested yet
      'requested',     -- operator requested payment (payments.ts: requestPayment)
      'pending',       -- citizen is mid-flow / mock pending
      'paid',          -- payment completed (payments.ts: completeMockPayment)
      'partial',       -- partial payment accepted (reserved for future use)
      'cancelled',     -- payment request cancelled (payments.ts: cancelPayment)
      'refunded'       -- refunded (reserved for future use)
    )
  );
