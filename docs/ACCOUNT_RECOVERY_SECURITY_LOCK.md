# Account Recovery + Takeover Prevention Lock

## Recovery
- Forgot password and reset flows required.
- Boss recovery requires emergency code + backup email + manual unlock path.

## Lock and Device Trust
- Account lock on repeated failures.
- Device binding required.
- Session limits enforced.

## Takeover Detection
- Geo or behavior anomaly should alert and optionally force logout.

## Access Traceability
- Login/session activity must be observable in operational logs.

## Policy Source
- config/account-security-policy.json
- Runtime guard: src/services/accountTakeoverGuard.ts
