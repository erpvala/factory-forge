# Version Control + Safe Rollback Lock

## Version Tagging
- Every release must carry a semantic tag and release metadata.
- Release policy source: config/release-control-policy.json
- Changelog source: docs/CHANGELOG.md

## Atomic Release Contract
- Frontend + backend + DB schema treated as one release unit.
- If validation fails, release is rejected.

## One-Click Rollback
- Command: npm run ops:release:rollback
- Script: scripts/release-rollback.mjs
- Includes code rollback + safe DB rollback contract + config restore.

## Validation
- Command: npm run ops:release:validate
- Health + route + flow checks must pass or rollback is required.

## Canary and Feature Flags
- Canary release must start with controlled user segment.
- New features default OFF and roll out gradually.
