// @ts-nocheck
import { marketplaceSearch } from '@/services/marketplaceSearch';

export type MarketplaceEventType = 'view' | 'click' | 'buy';

export interface MarketplaceWorkflowEvent {
  event_id: string;
  event_type: MarketplaceEventType;
  product_id: string;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CheckoutPayload {
  product_id: string;
  plan_id: string;
  price: number;
  payment_method: 'wallet' | 'upi' | 'bank' | 'crypto';
}

interface QueueJob {
  queue_id: string;
  channel: 'email' | 'notification';
  payload: Record<string, unknown>;
  created_at: string;
}

const queue: QueueJob[] = [];
const eventLog: MarketplaceWorkflowEvent[] = [];

function now() {
  return new Date().toISOString();
}

export function create_uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `00000000-0000-4000-8000-${seed.replace(/[^a-z0-9]/gi, '').padEnd(12, '0').slice(0, 12)}`;
}

export function is_uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

export function validate_checkout_payload(input: CheckoutPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.product_id) errors.push('product_id is required');
  if (!input.plan_id) errors.push('plan_id is required');
  if (!Number.isFinite(input.price) || input.price <= 0) errors.push('price must be a positive number');
  if (!['wallet', 'upi', 'bank', 'crypto'].includes(input.payment_method)) errors.push('payment_method is invalid');
  if (!is_uuid(input.plan_id)) errors.push('plan_id must be UUID');
  return { valid: errors.length === 0, errors };
}

export function track_marketplace_event(input: Omit<MarketplaceWorkflowEvent, 'event_id' | 'created_at'>) {
  const event: MarketplaceWorkflowEvent = {
    event_id: create_uuid(),
    created_at: now(),
    ...input,
  };
  eventLog.unshift(event);
  if (eventLog.length > 1000) {
    eventLog.length = 1000;
  }
  return event;
}

export function list_marketplace_events() {
  return [...eventLog];
}

export function queue_async_job(channel: 'email' | 'notification', payload: Record<string, unknown>) {
  const item: QueueJob = {
    queue_id: create_uuid(),
    channel,
    payload,
    created_at: now(),
  };
  queue.unshift(item);
  if (queue.length > 400) {
    queue.length = 400;
  }
  return item;
}

export function flush_async_jobs(limit = 10) {
  return queue.splice(Math.max(0, queue.length - Math.min(limit, queue.length))).reverse();
}

export async function search_marketplace_index(query: string, params?: { category?: string; minPrice?: number; maxPrice?: number; limit?: number }) {
  return marketplaceSearch.search(query, params);
}
