# Testing Guide

This project uses Playwright for End-to-End (E2E) testing. The test suite is organized into distinct projects within `playwright.config.ts` to manage authentication state cleanly and respect external provider rate limits.

## Test Projects

We separate our tests to prevent repeating rate-limited operations (like signing up) and to isolate unauthenticated vs authenticated states:

1. **`setup`**: Runs `tests/auth.setup.ts` to authenticate a standard test user (`test_citizen@example.com`). It attempts to log in first and falls back to signing up only if necessary, preserving the session state to `.auth/citizen.json`.
2. **`e2e-authenticated`**: Runs tests matching `*-auth.spec.ts`. These tests run with the pre-authenticated session state from the `setup` phase.
3. **`e2e-unauthenticated`**: Runs tests matching `*-unauth.spec.ts`. These tests run with no active session (useful for testing redirects and boundaries).
4. **`e2e-limits`**: Runs tests matching `*-limits.spec.ts`. These are isolated tests involving intensive or rate-limited behaviors (like mass signup flows).

## Running Tests Locally

You can run the full stable suite locally. Playwright will automatically resolve the `setup` dependency first:

```bash
# Runs setup, then all unauth and auth tests
npx playwright test
```

If you only want to run tests that don't require an active session:
```bash
npx playwright test --project=e2e-unauthenticated
```

## Rate Limits & Provider Constraints

Because we use live Supabase for MVP authentication, Supabase enforces an **Email Rate Limit** (e.g., 3 emails per hour for the same IP). 
- **Do not** write tests that repeatedly call `/signup`. 
- **Do** rely on `auth.setup.ts` to log into a single shared test account.
- If you absolutely must test a new signup flow, place it in `*-limits.spec.ts` and run it sparingly, or configure mock Supabase responses when moving to a full CI environment.

## Document Uploads (Phase 3)

Document upload flows involve multi-stage transactional logic (Database row -> Supabase Storage -> Database metadata).

- **Automated Tests**: The automated E2E tests (`e2e-authenticated`) mock file selection in the DOM using Playwright's `setInputFiles` API to verify the form submission constraints.
- **Manual QA Required**: 
  - Verifying the exact visual rendering and expiration of the generated signed URLs.
  - Testing the partial-failure cleanup under actual network drops (e.g., throttling network in DevTools right after the storage upload but before the metadata insert). 
  - Operator RLS boundaries (ensuring Operators cannot spoof network requests to generate signed URLs for unassigned cases).

## Realtime Chat (Phase 4)

The chat system utilizes Supabase's `postgres_changes` capability over WebSockets.

- **Automated Tests**: E2E tests can verify the UI mounts correctly, but reliably testing realtime WebSocket broadcasts typically requires complex mock setups.
- **Manual QA Required**:
  - Open two distinct browser sessions (e.g., standard browser for Citizen, Incognito for Operator).
  - Verify that sending a message in one immediately renders in the other without a page refresh.
  - Verify unauthorized users (e.g., an unassigned Operator) cannot read the messages or subscribe to the channel, as RLS will natively reject their subscription attempt.
