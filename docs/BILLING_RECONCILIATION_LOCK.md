# Billing Accuracy + Reconciliation Lock

## Single Billing Source
- Ledger is the canonical billing source.
- No parallel billing engine is allowed.

## Usage to Billing Map
- API usage -> cost
- Subscription -> charge
- Order -> revenue

## Reconciliation Rules
- Daily reconciliation required:
  - PayU vs payments
  - payments vs ledger
  - wallet vs ledger
- Mismatch must trigger alert.

## Runtime Hooks
- Service: src/services/billingReconciliationGuard.ts
- Records billing events and emits reconciliation alerts.

## Boss Panel KPIs
- Revenue
- Profit
- Pending payouts
