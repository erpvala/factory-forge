// @ts-nocheck

import policy from '../../config/billing-control-policy.json';

const BILLING_EVENTS_KEY = 'billing_events_log';
const RECON_REPORTS_KEY = 'billing_reconciliation_reports';

const readJson = (key: string, fallback: any) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const recordBillingEvent = (event: {
  type: 'api_usage' | 'subscription' | 'order' | 'refund' | 'wallet';
  referenceId: string;
  amount: number;
  metadata?: Record<string, unknown>;
}) => {
  const events = readJson(BILLING_EVENTS_KEY, []);
  const mappedType = (policy as any).usage_billing_map?.[event.type] || event.type;

  events.push({
    ...event,
    mappedType,
    timestamp: new Date().toISOString(),
  });

  writeJson(BILLING_EVENTS_KEY, events.slice(-20000));
};

export const runBillingReconciliation = () => {
  const events = readJson(BILLING_EVENTS_KEY, []);

  const payu = events.filter((e: any) => e.type === 'order').reduce((a: number, e: any) => a + Number(e.amount || 0), 0);
  const payments = events
    .filter((e: any) => e.type === 'subscription' || e.type === 'order')
    .reduce((a: number, e: any) => a + Number(e.amount || 0), 0);
  const ledger = events.reduce((a: number, e: any) => a + Number(e.amount || 0), 0);
  const wallet = events.filter((e: any) => e.type === 'wallet').reduce((a: number, e: any) => a + Number(e.amount || 0), 0);

  const mismatches = [] as string[];
  if (Math.abs(payu - payments) > 0.01) mismatches.push('payu_vs_payments');
  if (Math.abs(payments - ledger) > 0.01) mismatches.push('payments_vs_ledger');
  if (Math.abs(wallet - ledger) > 0.01 && wallet !== 0) mismatches.push('wallet_vs_ledger');

  const report = {
    at: new Date().toISOString(),
    payu,
    payments,
    ledger,
    wallet,
    mismatches,
    ok: mismatches.length === 0,
  };

  const reports = readJson(RECON_REPORTS_KEY, []);
  reports.push(report);
  writeJson(RECON_REPORTS_KEY, reports.slice(-500));

  if (!report.ok) {
    window.dispatchEvent(new CustomEvent('sv:billing-reconciliation-alert', { detail: report }));
  }

  return report;
};
