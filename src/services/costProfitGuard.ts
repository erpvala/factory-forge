// @ts-nocheck

import policy from '../../config/cost-control-policy.json';

const USAGE_KEY = 'cost_profit_usage_window';
const ORDER_KEY = 'cost_profit_orders';

const toNum = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const now = () => Date.now();

const getPolicy = () => policy as any;

export const enforceApiCostLimit = (params: { userId: string; tenantId?: string }) => {
  const p = getPolicy();
  const userLimit = toNum(p.api_limits?.per_user_per_hour, 1200);
  const tenantLimit = toNum(p.api_limits?.per_tenant_per_hour, 12000);

  const windowStart = now() - 60 * 60 * 1000;
  const usage = readJson<any[]>(USAGE_KEY, []).filter((row) => row.timestamp >= windowStart);

  const userCalls = usage.filter((row) => row.userId === params.userId).length;
  if (userCalls >= userLimit) {
    throw new Error(`api_user_limit_exceeded:${params.userId}:${userCalls}/${userLimit}`);
  }

  if (params.tenantId) {
    const tenantCalls = usage.filter((row) => row.tenantId === params.tenantId).length;
    if (tenantCalls >= tenantLimit) {
      throw new Error(`api_tenant_limit_exceeded:${params.tenantId}:${tenantCalls}/${tenantLimit}`);
    }
  }
};

export const enforceAiUsageLimit = (params: {
  userId: string;
  plan: 'free' | 'paid';
  tokenEstimate: number;
}) => {
  const p = getPolicy();
  const planCfg = p.ai_limits?.[params.plan] || p.ai_limits?.free || { requests_per_hour: 40, tokens_per_hour: 80000 };

  const windowStart = now() - 60 * 60 * 1000;
  const usage = readJson<any[]>(USAGE_KEY, []).filter((row) => row.timestamp >= windowStart && row.userId === params.userId);

  const aiRequests = usage.filter((row) => row.isAi).length;
  const aiTokens = usage.filter((row) => row.isAi).reduce((acc, row) => acc + toNum(row.tokens, 0), 0);

  if (aiRequests >= toNum(planCfg.requests_per_hour, 40)) {
    throw new Error(`ai_request_limit_exceeded:${params.userId}`);
  }

  if (aiTokens + toNum(params.tokenEstimate, 0) > toNum(planCfg.tokens_per_hour, 80000)) {
    throw new Error(`ai_token_limit_exceeded:${params.userId}`);
  }
};

export const trackApiUsageCost = (params: {
  module: string;
  userId: string;
  tenantId?: string;
  durationMs: number;
  cached?: boolean;
  isAi?: boolean;
  tokens?: number;
}) => {
  const current = readJson<any[]>(USAGE_KEY, []);
  const unitCost = params.cached ? 0 : Math.max(0.00005, params.durationMs / 1000000);

  const next = [
    ...current,
    {
      ...params,
      unitCost,
      timestamp: now(),
    },
  ].slice(-20000);

  writeJson(USAGE_KEY, next);

  detectCostSpike(next);
};

const detectCostSpike = (usageRows: any[]) => {
  const p = getPolicy();
  const lookbackMinutes = toNum(p.cost_spike?.lookback_minutes, 30);
  const percentThreshold = toNum(p.cost_spike?.percent_increase_threshold, 60);

  const nowTs = now();
  const latestWindow = usageRows.filter((row) => row.timestamp >= nowTs - lookbackMinutes * 60 * 1000);
  const previousWindow = usageRows.filter(
    (row) => row.timestamp < nowTs - lookbackMinutes * 60 * 1000 && row.timestamp >= nowTs - 2 * lookbackMinutes * 60 * 1000,
  );

  const latestCost = latestWindow.reduce((acc, row) => acc + toNum(row.unitCost, 0), 0);
  const previousCost = previousWindow.reduce((acc, row) => acc + toNum(row.unitCost, 0), 0);

  if (previousCost <= 0) return;
  const deltaPercent = ((latestCost - previousCost) / previousCost) * 100;
  if (deltaPercent >= percentThreshold) {
    window.dispatchEvent(
      new CustomEvent('sv:cost-spike-alert', {
        detail: {
          latestCost,
          previousCost,
          deltaPercent,
          threshold: percentThreshold,
          timestamp: new Date().toISOString(),
        },
      }),
    );
  }
};

export const assertOrderProfit = (params: {
  orderId: string;
  module: string;
  revenue: number;
  cost: number;
  thresholdPercent?: number;
}) => {
  const p = getPolicy();
  const marginThreshold = toNum(params.thresholdPercent, toNum(p.profit?.default_min_margin_percent, 12));
  const criticalBlock = toNum(p.profit?.critical_block_margin_percent, 5);

  const revenue = toNum(params.revenue, 0);
  const cost = toNum(params.cost, 0);
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : -100;

  const orders = readJson<any[]>(ORDER_KEY, []);
  orders.push({
    ...params,
    profit,
    margin,
    timestamp: new Date().toISOString(),
  });
  writeJson(ORDER_KEY, orders.slice(-5000));

  if (margin < criticalBlock) {
    throw new Error(`profit_blocked:${params.orderId}:margin=${margin.toFixed(2)}%`);
  }

  if (margin < marginThreshold) {
    window.dispatchEvent(
      new CustomEvent('sv:profit-threshold-alert', {
        detail: {
          orderId: params.orderId,
          module: params.module,
          revenue,
          cost,
          profit,
          margin,
          threshold: marginThreshold,
        },
      }),
    );
  }

  return { profit, margin };
};
