# Troubleshoot Guide

## Guard Failure: Route Manifest Hash
- Run: npm run guard:generate-route-hash
- Re-run: npm run guard:permanent

## Guard Failure: Module Sync
- Check src/config/controlPanelModules.ts mapping integrity
- Ensure route/api/db derivation pattern is preserved

## Guard Failure: Privacy Lock
- Search for raw sensitive console logs
- Use sanitizeLogPayload before logging structured payloads

## Guard Failure: Cost/Profit Lock
- Validate config/cost-control-policy.json
- Ensure edge-client imports and invokes cost guard hooks
