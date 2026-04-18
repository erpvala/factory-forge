# System Master Map

## Modules Registry
- Source: src/config/controlPanelModules.ts
- Canonical fields per module: key(id), route, apiBase, dbTable, allowedRoles
- Route format: /control-panel/:module
- API format: /api/v1/:module
- DB table format: module id with '-' replaced by '_'

## Routes
- Public entry: /login
- Control entry: /control-panel
- Runtime allowlist + lock: route_config.json + src/lib/security/routeLock.ts

## API Surface
- Client transport: src/lib/api/edge-client.ts
- Module-bound calls: callModuleApi(moduleKey, path, options)
- Signature + origin checks: src/middleware.ts

## DB Binding
- Startup/CI consistency verifier: scripts/verify-module-synchronization.mjs
- Optional strict probe: VITE_STRICT_DB_SYNC=true

## Guard Chain
- Orchestrator: scripts/run-permanent-guard.mjs
- CI workflow: .github/workflows/ui-lock-guard.yml
