# Runbooks

## Deploy Runbook
1. Run permanent guard checks
2. Run strict lint and build
3. Execute lock E2E test
4. Deploy artifact
5. Verify health and logs

## Rollback Runbook
1. Halt current deploy traffic
2. Revert to previous artifact
3. Re-run lock checks
4. Validate login/control-panel flow

## Incident Runbook
1. Identify affected module
2. Check route-lock and sync incidents
3. Apply mitigation
4. Validate flow-integrity and API health

## Disaster Recover Runbook (One Command)
- Command: npm run ops:disaster-recover
- Script: scripts/disaster-recover.mjs
- Weekly drill: npm run ops:dr-drill
