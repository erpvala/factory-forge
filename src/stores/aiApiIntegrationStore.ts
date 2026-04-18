// @ts-nocheck
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import cryptoEngine, { EncryptedData } from '@/lib/crypto/CryptoEngine';
import { CATEGORY_LABELS, PROVIDER_CATALOG, findProvider, type IntegrationCategory } from '@/lib/api-integration/provider-catalog';

export type IntegrationStatus = 'active' | 'inactive' | 'error';
export type EventSeverity = 'info' | 'warning' | 'critical';

export interface ManagedIntegration {
  api_id: string;
  provider_id: string;
  api_name: string;
  category: IntegrationCategory;
  encrypted_credentials: EncryptedData;
  masked_credentials: Record<string, string>;
  status: IntegrationStatus;
  usage_limit: number;
  usage_count: number;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationEvent {
  id: string;
  api_id: string | null;
  title: string;
  message: string;
  severity: EventSeverity;
  created_at: string;
}

interface RegisterPayload {
  provider_id: string;
  api_name: string;
  usage_limit: number;
  credentials: Record<string, string>;
}

interface AIApiIntegrationState {
  integrations: ManagedIntegration[];
  events: IntegrationEvent[];
  vaultReady: boolean;
  registerIntegration: (payload: RegisterPayload) => Promise<{ ok: boolean; error?: string }>;
  toggleIntegration: (apiId: string) => void;
  updateUsageLimit: (apiId: string, usageLimit: number) => void;
  recordUsage: (apiId: string, amount?: number) => void;
  recordError: (apiId: string, message: string) => void;
  rotateCredentials: (apiId: string, credentials: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  markRecovered: (apiId: string) => void;
  getProviderLabel: (providerId: string) => string;
}

const VAULT_SECRET = import.meta.env.VITE_AI_API_MANAGER_VAULT_SECRET || 'vala-ai-api-manager-vault';

async function logAIApiManagerAction(action: string, payload: Record<string, unknown> = {}) {
  try {
    await fetch('/api/v1/ai-api-manager', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    // Keep UI responsive even if logging fails.
  }
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function maskSecret(value: string) {
  if (!value) return 'not-set';
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(4, value.length - 6))}${value.slice(-3)}`;
}

function seedEvents(): IntegrationEvent[] {
  return [
    {
      id: createId('evt'),
      api_id: null,
      title: 'Vault initialized',
      message: 'Encrypted key vault ready for central API manager.',
      severity: 'info',
      created_at: new Date().toISOString(),
    },
  ];
}

async function encryptCredentials(credentials: Record<string, string>) {
  return cryptoEngine.encrypt(JSON.stringify(credentials), VAULT_SECRET);
}

function providerCategory(providerId: string): IntegrationCategory {
  return findProvider(providerId)?.category ?? 'payment';
}

export const useAIApiIntegrationStore = create<AIApiIntegrationState>()(
  persist(
    (set, get) => ({
      integrations: [],
      events: seedEvents(),
      vaultReady: true,

      async registerIntegration(payload) {
        const provider = findProvider(payload.provider_id);
        if (!provider) {
          return { ok: false, error: 'Unknown provider' };
        }
        if (!payload.api_name.trim()) {
          return { ok: false, error: 'API name is required' };
        }
        const missingField = provider.keyFields.find((field) => !payload.credentials[field.key]?.trim());
        if (missingField) {
          return { ok: false, error: `${missingField.label} is required` };
        }

        const encrypted_credentials = await encryptCredentials(payload.credentials);
        const masked_credentials = Object.fromEntries(
          Object.entries(payload.credentials).map(([key, value]) => [key, maskSecret(value)]),
        );
        const api_id = createId('api');
        const timestamp = new Date().toISOString();

        const integration: ManagedIntegration = {
          api_id,
          provider_id: payload.provider_id,
          api_name: payload.api_name.trim(),
          category: provider.category,
          encrypted_credentials,
          masked_credentials,
          status: 'active',
          usage_limit: payload.usage_limit,
          usage_count: 0,
          error_count: 0,
          last_error: null,
          created_at: timestamp,
          updated_at: timestamp,
        };

        set((state) => ({
          integrations: [integration, ...state.integrations],
          events: [
            {
              id: createId('evt'),
              api_id,
              title: 'Integration registered',
              message: `${payload.api_name} connected under ${provider.providerName}. Credentials stored encrypted.`,
              severity: 'info',
              created_at: timestamp,
            },
            ...state.events,
          ].slice(0, 80),
        }));

        void logAIApiManagerAction('register', {
          api_id,
          provider_id: payload.provider_id,
          api_name: payload.api_name.trim(),
          usage_limit: payload.usage_limit,
        });

        return { ok: true };
      },

      toggleIntegration(apiId) {
        set((state) => {
          const updated = state.integrations.map((integration) => {
            if (integration.api_id !== apiId) return integration;
            const nextStatus = integration.status === 'active' ? 'inactive' : 'active';
            return {
              ...integration,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            };
          });
          const changed = updated.find((integration) => integration.api_id === apiId);
          return {
            integrations: updated,
            events: changed
              ? [
                  {
                    id: createId('evt'),
                    api_id: apiId,
                    title: changed.status === 'active' ? 'Integration enabled' : 'Integration disabled',
                    message: `${changed.api_name} is now ${changed.status}. Central control updated.`,
                    severity: 'info',
                    created_at: new Date().toISOString(),
                  },
                  ...state.events,
                ].slice(0, 80)
              : state.events,
          };
        });
        void logAIApiManagerAction('toggle', { api_id: apiId });
      },

      updateUsageLimit(apiId, usageLimit) {
        set((state) => ({
          integrations: state.integrations.map((integration) =>
            integration.api_id === apiId
              ? { ...integration, usage_limit: usageLimit, updated_at: new Date().toISOString() }
              : integration,
          ),
        }));
        void logAIApiManagerAction('update', { api_id: apiId, usage_limit: usageLimit });
      },

      recordUsage(apiId, amount = 1) {
        set((state) => {
          const integrations = state.integrations.map((integration) => {
            if (integration.api_id !== apiId) return integration;
            const usage_count = integration.usage_count + amount;
            const exceeded = usage_count >= integration.usage_limit;
            return {
              ...integration,
              usage_count,
              status: exceeded ? 'error' : integration.status,
              last_error: exceeded ? 'Usage limit reached' : integration.last_error,
              updated_at: new Date().toISOString(),
            };
          });
          const changed = integrations.find((integration) => integration.api_id === apiId);
          return {
            integrations,
            events: changed
              ? [
                  {
                    id: createId('evt'),
                    api_id: apiId,
                    title: changed.status === 'error' ? 'Usage limit exceeded' : 'Usage tracked',
                    message: `${changed.api_name} usage is ${changed.usage_count}/${changed.usage_limit}.`,
                    severity: changed.status === 'error' ? 'warning' : 'info',
                    created_at: new Date().toISOString(),
                  },
                  ...state.events,
                ].slice(0, 80)
              : state.events,
          };
        });
      },

      recordError(apiId, message) {
        set((state) => {
          const integrations = state.integrations.map((integration) =>
            integration.api_id === apiId
              ? {
                  ...integration,
                  status: 'error',
                  error_count: integration.error_count + 1,
                  last_error: message,
                  updated_at: new Date().toISOString(),
                }
              : integration,
          );
          const changed = integrations.find((integration) => integration.api_id === apiId);
          return {
            integrations,
            events: changed
              ? [
                  {
                    id: createId('evt'),
                    api_id: apiId,
                    title: 'Error detected',
                    message: `${changed.api_name}: ${message}`,
                    severity: 'critical',
                    created_at: new Date().toISOString(),
                  },
                  ...state.events,
                ].slice(0, 80)
              : state.events,
          };
        });
        void logAIApiManagerAction('error', { api_id: apiId, message });
      },

      async rotateCredentials(apiId, credentials) {
        const integration = get().integrations.find((item) => item.api_id === apiId);
        if (!integration) {
          return { ok: false, error: 'Integration not found' };
        }
        const encrypted_credentials = await encryptCredentials(credentials);
        const masked_credentials = Object.fromEntries(
          Object.entries(credentials).map(([key, value]) => [key, maskSecret(value)]),
        );
        const now = new Date().toISOString();
        set((state) => ({
          integrations: state.integrations.map((item) =>
            item.api_id === apiId
              ? {
                  ...item,
                  encrypted_credentials,
                  masked_credentials,
                  status: item.status === 'inactive' ? 'inactive' : 'active',
                  last_error: null,
                  updated_at: now,
                }
              : item,
          ),
          events: [
            {
              id: createId('evt'),
              api_id: apiId,
              title: 'Credentials rotated',
              message: `${integration.api_name} keys were rotated and re-encrypted.`,
              severity: 'info',
              created_at: now,
            },
            ...state.events,
          ].slice(0, 80),
        }));
        void logAIApiManagerAction('rotate', { api_id: apiId });
        return { ok: true };
      },

      markRecovered(apiId) {
        set((state) => {
          const integrations = state.integrations.map((integration) =>
            integration.api_id === apiId
              ? {
                  ...integration,
                  status: 'active',
                  last_error: null,
                  updated_at: new Date().toISOString(),
                }
              : integration,
          );
          const changed = integrations.find((integration) => integration.api_id === apiId);
          return {
            integrations,
            events: changed
              ? [
                  {
                    id: createId('evt'),
                    api_id: apiId,
                    title: 'Recovery complete',
                    message: `${changed.api_name} returned to healthy state.`,
                    severity: 'info',
                    created_at: new Date().toISOString(),
                  },
                  ...state.events,
                ].slice(0, 80)
              : state.events,
          };
        });
        void logAIApiManagerAction('recover', { api_id: apiId });
      },

      getProviderLabel(providerId) {
        return findProvider(providerId)?.providerName ?? providerId;
      },
    }),
    {
      name: 'ai-api-integration-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        integrations: state.integrations.map((integration) => ({
          ...integration,
          encrypted_credentials: {
            ciphertext: '',
            iv: '',
            salt: '',
          },
        })),
        events: state.events,
        vaultReady: state.vaultReady,
      }),
    },
  ),
);

export function getIntegrationSummary(integrations: ManagedIntegration[]) {
  const active = integrations.filter((item) => item.status === 'active').length;
  const inactive = integrations.filter((item) => item.status === 'inactive').length;
  const error = integrations.filter((item) => item.status === 'error').length;
  const totalUsage = integrations.reduce((sum, item) => sum + item.usage_count, 0);
  const totalLimit = integrations.reduce((sum, item) => sum + item.usage_limit, 0);
  return {
    total: integrations.length,
    active,
    inactive,
    error,
    totalUsage,
    totalLimit,
    coverage: totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0,
  };
}

export { PROVIDER_CATALOG, CATEGORY_LABELS };
