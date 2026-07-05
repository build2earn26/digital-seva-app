# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

A rural-first digital services platform to validate a citizen-to-center workflow in a limited pilot geography, allowing citizens to discover services, upload documents in stages, chat with operators, make split payments, and track application progress, while operators and admins manage workflows and governance.

Working directory: c:\Users\Shiva\Desktop\Antigravity\digital-seva-app
Integrity mode: demo

## Requirements

### R1. Unified Stack: Next.js + TypeScript + Tailwind v4 + Supabase
- Set up a single Next.js full-stack web application using TypeScript and Tailwind CSS v4.
- Use Supabase for database (PostgreSQL), Authentication (email/phone login), Storage (private document buckets with signed URLs), and Realtime (for real-time case chat synchronization).
- Design a premium, mobile-first design for the Citizen dashboard and desktop-optimized layouts for the Operator and Admin dashboards.

### R2. Staged Document Upload Pipeline
- Implement a document pipeline where citizens can upload required files in multiple stages.
- The system must track each document's state (`PENDING`, `APPROVED`, `REJECTED`).
- Operators must be able to view documents, mark statuses, and input feedback/reasoning for rejected documents.

### R3. Service Directory & Matching
- Support bilingual service search (English/Telugu) and details screen displaying document checklists and fee tables.
- Match users to nearby centers based on a District/Mandal/Village hierarchy selection flow.

### R4. Two-Stage Payment Integration
- Implement staged payments:
  1. Pre-payment: Review fee required to submit documents to the operator.
  2. Final Balance: Fee paid after operator document approval and prior to governmental submission.
- Transactions are processed through simulated endpoints acting as mock payment gateways (e.g., webhook simulators).

### R5. Case Chat
- Create a real-time messaging thread (using Supabase Realtime) associated with each application case.
- Allow messages to contain optional file attachments (supporting documents).

### R6. Live Gemini AI Assistant
- Integrate a live Google Gemini API endpoint to provide:
  1. Multilingual search query parsing and translation.
  2. Explanations of required documents in simple Telugu/English.
  3. Pre-upload validation checks (checking if the document text matches the required slot name).

### R7. Environment Configuration
- The application must configure and run with the following environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `DATABASE_URL` (direct connection string to Supabase Postgres)

---

## Verification & Acceptance Criteria

### E2E Flow Verification (Playwright)
The agent team must write and pass automated Playwright E2E integration test scripts verifying:
- [ ] **Citizen Flow**: Citizen login, searching a service in Telugu/English, choosing a district/mandal center, creating a case, uploading initial documents, making a simulated pre-payment.
- [ ] **Operator Flow**: Operator login, listing pending cases, reviewing the uploaded citizen documents, rejecting one document with feedback, and approving others.
- [ ] **Correction Flow**: Citizen viewing feedback, re-uploading the document, and operator approving the final document.
- [ ] **Completion Flow**: Citizen paying the final balance, operator marking the case as submitted to the government portal.

### API & Unit Verification (Jest / Vitest)
The agent team must write and pass unit/integration tests verifying:
- [ ] **Authentication Middleware**: Verifying access control for `CITIZEN`, `OPERATOR`, and `ADMIN` roles on API routes.
- [ ] **State Machine Transitions**: Validating database state constraints (e.g., cannot transition from `DRAFT` to `PENDING_REVIEW` without pre-payment).
- [ ] **Gemini Integration**: Validating response formats from the Gemini API translator/assistant utility.

### Technical & Quality Acceptance Criteria
- [ ] **No Placeholder Pages**: All pages (Citizen home, case page, operator review, admin center management) must be functional.
- [ ] **Multilingual Toggle**: A working language toggle (English/Telugu) that translates core UI components.
- [ ] **Performance**: Fast page transitions using Next.js App Router and dynamic Tailwind CSS v4 assets.
