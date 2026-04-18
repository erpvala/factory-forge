import { describe, expect, it } from 'vitest';
import { getDemoRoleAccounts } from '@/services/demoRoleRegistry';
import { ROLE_DASHBOARD_ROUTE } from '@/routes/routes';

describe('demo role registry', () => {
  it('builds one demo login per role dashboard route', () => {
    const accounts = getDemoRoleAccounts();
    const roleCount = Object.keys(ROLE_DASHBOARD_ROUTE).length;

    expect(accounts.length).toBe(roleCount);
    expect(accounts.every((a) => a.email.endsWith('@softwarevala.com'))).toBe(true);
    expect(accounts.every((a) => a.password.startsWith('Vala@'))).toBe(true);
    expect(accounts.every((a) => typeof a.redirectPath === 'string' && a.redirectPath.length > 1)).toBe(true);
  });
});
