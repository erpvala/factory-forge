# API Documentation Lock

## Source of Truth
- API transport and resilience: src/lib/api/edge-client.ts
- Auth/session API: src/app/api/auth/*
- Existing API spec: src/docs/API_SPECIFICATION.md

## Required Endpoint Contract Fields
- Endpoint path
- Auth requirement
- Request schema summary
- Response schema summary
- Error codes and retries

## Cost and Privacy Controls
- Cost/profit runtime control: src/services/costProfitGuard.ts
- Log sanitization: src/lib/security/dataPrivacy.ts
- Privacy regression scanner: scripts/verify-privacy-lock.mjs
