# Onboarding Guide

## Day 1 Setup
1. Install dependencies
2. Run permanent guard suite
3. Understand control-panel route lock architecture
4. Review module registry and synchronization checks

## Core Files to Learn
- src/config/controlPanelModules.ts
- src/lib/security/routeLock.ts
- src/lib/api/edge-client.ts
- scripts/run-permanent-guard.mjs

## Safe Development Workflow
1. Add/modify module in registry first
2. Use reusable components only
3. Keep API calls through shared client helpers
4. Run guards before commit

## Recovery Readiness
- Learn deploy/rollback runbooks
- Execute weekly DR drill in CI/local
