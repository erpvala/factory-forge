# Access Guide

## Roles and Scope
- boss_owner: full control, restore trigger authority
- module managers: scoped control-panel module access
- support/dev: limited views, no unrestricted sensitive data

## Permission Boundaries
- Sensitive fields are masked by default
- Role-specific unmasking must be explicit
- API responses must return only permitted fields

## Dashboards
- Single entry: /login
- Core console: /control-panel
- Unknown or blocked route -> redirect /login
