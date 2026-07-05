# Known Limitations & Non-Goals

This document outlines the current boundaries of the Digital Seva MVP and specific features that were intentionally excluded from the initial release to maintain focus.

## 1. Authentication & Roles
- **No Hierarchical Roles**: The MVP supports a flat structure of Citizens, Operators, and Admins. There is no multi-level hierarchy (e.g., District Manager vs Mandal Supervisor) for staggered approvals or escalation flows.
- **No GovID Integration**: Auth relies strictly on standard Supabase email/password auth. Integration with external identity providers (e.g., Aadhaar, Digilocker, e-Pramaan) is out of scope.

## 2. Payments
- **Mock Implementation Only**: The staged payment lifecycle (`unpaid` -> `requested` -> `pending` -> `paid`) is entirely simulated via internal server actions. 
- **No Real Gateways**: There is no integration with actual payment providers (e.g., Razorpay, Stripe, BillDesk).
- **No Automatic Reconciliation**: Dynamic fee calculation based on case metadata and automated financial reconciliation are not built.

## 3. Realtime Chat
- **No Chat Attachments**: The chat system supports text only. Users must use the dedicated Case Document upload system to share files.
- **No Presence/Typing Indicators**: The websocket layer (Postgres Changes) focuses strictly on durable message delivery and does not track active user presence or typing states.
- **High-Volume Scaling**: Postgres Changes (which relies on Write-Ahead Log polling) is sufficient for MVP volume, but at massive scale, it may require migrating to Supabase Broadcast channels to reduce database overhead.

## 4. Document Processing
- **No OCR / AI Extraction**: Uploaded documents are stored raw. There is no pipeline for scanning forms, extracting text, or auto-filling case metadata using Gemini or OCR APIs.
- **No Malware Scanning**: Files are validated by basic MIME types and size on the server, but there is no active virus/malware scanning pipeline integrated into the Storage bucket triggers.

## 5. Operations & BI
- **Basic Aggregates Only**: The Admin dashboard provides simple count aggregations. There is no deep Business Intelligence (BI) integration, historical trend graphing, or CSV data export.
- **No SLA Tracking**: There are no automated alerts for overdue tickets, aging cases, or Service Level Agreement (SLA) breaches.
