# Ops Playbook

## Payment Failure Runbook
1. Mark module health degraded: payment_gateway.
2. Disable payment capture using feature flag: payments.capture.enabled=false.
3. Enable incident mode with critical modules only: order_system, payment_gateway, license_system, security_manager.
4. Run backfill jobs for impacted orgs.
5. Run revenue reconciliation and verify: orders == payments == wallet entries.
6. If release regression is confirmed, execute release rollback toggle.
7. Acknowledge critical on-call alert after validation.

## API Down Runbook
1. Mark affected module unhealthy and inspect dependency fallback map.
2. Enable incident mode to keep only critical modules live.
3. Raise/verify critical on-call alerts.
4. Trigger release rollback if outage started after deployment.
5. Replay missed events with backfill jobs.
6. Validate KPI guardrails and clear incident after recovery.

## Daily Revenue-Safe Operations
1. Run revenue reconciliation for each tenant org.
2. Verify no missing payments and no missing wallet entries.
3. Export legal/audit report for compliance archive.
4. Review cost snapshot and enforce spend limit.
5. Review SLA breach rate and customer feedback insight action.

## On-Call Triage Priority
1. Payment and license path outage.
2. Data mismatch in reconciliation.
3. Security/fraud hold spikes.
4. Elevated error-rate KPI breach.
5. SLA breach trend and support backlog.
