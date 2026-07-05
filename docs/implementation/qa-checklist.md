# QA Checklist

## Auth
- [ ] Email/password signup creates profile with `citizen` role
- [ ] Unverified email cannot access protected routes
- [ ] Login returns session and refreshes before expiry
- [ ] Password reset changes password and invalidates prior sessions
- [ ] Role middleware blocks unauthorized route access
- [ ] Operator/admin routes return 403 for citizen role
- [ ] Logout revokes server-side access where applicable

## Uploads
- [ ] Allowed types enforced server-side
- [ ] Max size enforced server-side
- [ ] Oversized or invalid type returns actionable message
- [ ] Signed URL upload succeeds for approved role on accessible request
- [ ] Uploaded document metadata persists and links to correct request
- [ ] Upload without request association is rejected
- [ ] Failed upload does not create orphan document record

## Role enforcement
- [ ] Citizen cannot view other citizens' requests
- [ ] Operator can view only assigned requests unless admin overrides
- [ ] Admin can read all requests
- [ ] Document access follows request access rules
- [ ] Chat access follows request access rules
- [ ] Payment init is allowed only for request owner
- [ ] Admin actions emit audit log entries
- [ ] Status transitions respect allowed state machine
