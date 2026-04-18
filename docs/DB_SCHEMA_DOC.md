# DB Schema Documentation

## Primary References
- ERD: docs/DATABASE_ERD.md
- Diagram: docs/DATABASE_DIAGRAM.png

## Required Documentation Sections
- Table list
- Key fields and constraints
- Relations and foreign keys
- Role-based sensitive fields

## Runtime Validation Hooks
- Module route/api/db synchronization: scripts/verify-module-synchronization.mjs
- Optional strict table probes: VITE_STRICT_DB_SYNC=true
