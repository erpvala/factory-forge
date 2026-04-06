// @ts-nocheck
import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Cable,
  CheckCircle2,
  Cloud,
  Globe2,
  KeyRound,
  Mail,
  MapPinned,
  MessageSquareMore,
  Power,
  RefreshCw,
  Save,
  Shield,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  PROVIDER_CATALOG,
  useAIApiIntegrationStore,
  getIntegrationSummary,
} from '@/stores/aiApiIntegrationStore';
import { findProvider, type IntegrationCategory } from '@/lib/api-integration/provider-catalog';

const CATEGORY_ICONS: Record<IntegrationCategory, React.ElementType> = {
  payment: Wallet,
  email: Mail,
  sms_otp: MessageSquareMore,
  storage: Cloud,
  push: BellRing,
  map_geo: MapPinned,
  analytics: BarChart3,
  oauth: Shield,
  hosting: Globe2,
};

const CATEGORY_COLORS: Record<IntegrationCategory, string> = {
  payment: 'from-emerald-500/20 to-lime-500/10 border-emerald-500/20 text-emerald-300',
  email: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/20 text-cyan-300',
  sms_otp: 'from-orange-500/20 to-amber-500/10 border-orange-500/20 text-orange-300',
  storage: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/20 text-fuchsia-300',
  push: 'from-violet-500/20 to-indigo-500/10 border-violet-500/20 text-violet-300',
  map_geo: 'from-sky-500/20 to-teal-500/10 border-sky-500/20 text-sky-300',
  analytics: 'from-rose-500/20 to-red-500/10 border-rose-500/20 text-rose-300',
  oauth: 'from-slate-500/20 to-zinc-500/10 border-slate-500/20 text-slate-300',
  hosting: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20 text-blue-300',
};

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const EMPTY_FORM = {
  provider_id: '',
  api_name: '',
  usage_limit: '10000',
  notes: '',
};

export default function CentralIntegrationHub() {
  const {
    integrations,
    events,
    vaultReady,
    registerIntegration,
    toggleIntegration,
    updateUsageLimit,
    recordUsage,
    recordError,
    rotateCredentials,
    markRecovered,
    getProviderLabel,
  } = useAIApiIntegrationStore();

  const [openCreate, setOpenCreate] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [credentialState, setCredentialState] = useState<Record<string, string>>({});
  const [rotationTarget, setRotationTarget] = useState<string | null>(null);
  const [rotationState, setRotationState] = useState<Record<string, string>>({});

  const summary = useMemo(() => getIntegrationSummary(integrations), [integrations]);
  const provider = selectedProvider ? findProvider(selectedProvider) : null;

  const groupedProviders = useMemo(() => {
    return PROVIDER_CATALOG.reduce((acc, current) => {
      const key = current.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(current);
      return acc;
    }, {} as Record<IntegrationCategory, typeof PROVIDER_CATALOG>);
  }, []);

  async function handleRegister() {
    const result = await registerIntegration({
      provider_id: formState.provider_id,
      api_name: formState.api_name,
      usage_limit: Number(formState.usage_limit || 0),
      credentials: credentialState,
    });
    if (!result.ok) {
      toast.error(result.error || 'Failed to register integration');
      return;
    }
    toast.success('Integration registered in central control hub');
    setOpenCreate(false);
    setSelectedProvider('');
    setFormState(EMPTY_FORM);
    setCredentialState({});
  }

  async function handleRotate(apiId: string) {
    const result = await rotateCredentials(apiId, rotationState);
    if (!result.ok) {
      toast.error(result.error || 'Failed to rotate credentials');
      return;
    }
    toast.success('Credentials rotated and re-encrypted');
    setRotationTarget(null);
    setRotationState({});
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              <Cable className="h-3.5 w-3.5" />
              AI API Manager
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Central Integration Hub</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              One place for payment, email, SMS, storage, push, geo, analytics, OAuth, and hosting credentials with encrypted key storage, central enable/disable control, usage tracking, and error monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => setOpenCreate(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Register Integration
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Connected" value={summary.total} icon={Cable} tone="cyan" />
          <StatCard title="Active" value={summary.active} icon={CheckCircle2} tone="emerald" />
          <StatCard title="Error State" value={summary.error} icon={AlertTriangle} tone="red" />
          <StatCard title="Usage Volume" value={summary.totalUsage} icon={Activity} tone="violet" />
          <StatCard title="Vault" value={vaultReady ? 'Encrypted' : 'Offline'} icon={Shield} tone="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Provider Catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(groupedProviders).map(([category, providers]) => {
                const Icon = CATEGORY_ICONS[category as IntegrationCategory];
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon className="h-4 w-4" />
                      {CATEGORY_LABELS[category as IntegrationCategory]}
                    </div>
                    <div className="grid gap-2">
                      {providers.map((item) => (
                        <button
                          key={item.providerId}
                          onClick={() => {
                            setOpenCreate(true);
                            setSelectedProvider(item.providerId);
                            setFormState((current) => ({ ...current, provider_id: item.providerId, api_name: item.providerName }));
                            setCredentialState(Object.fromEntries(item.keyFields.map((field) => [field.key, ''])));
                          }}
                          className={cn(
                            'rounded-xl border bg-gradient-to-br px-4 py-3 text-left transition hover:translate-y-[-1px] hover:border-cyan-400/30',
                            CATEGORY_COLORS[item.category],
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">{item.providerName}</p>
                              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                            </div>
                            {item.optional ? <Badge className="border-white/10 bg-white/10 text-slate-300">Optional</Badge> : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Managed Integrations</CardTitle>
              <Badge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-300">Control Center</Badge>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
                  No integrations registered yet. Start with Razorpay, Stripe, SendGrid, Twilio, S3, FCM, or Maps.
                </div>
              ) : (
                <div className="space-y-3">
                  {integrations.map((integration) => {
                    const usagePercent = integration.usage_limit > 0 ? Math.min(100, Math.round((integration.usage_count / integration.usage_limit) * 100)) : 0;
                    const providerMeta = findProvider(integration.provider_id);
                    return (
                      <div key={integration.api_id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-medium text-white">{integration.api_name}</h3>
                              <Badge className={STATUS_STYLES[integration.status]}>{integration.status}</Badge>
                              <Badge className="border-white/10 bg-white/5 text-slate-300">{CATEGORY_LABELS[integration.category]}</Badge>
                            </div>
                            <p className="text-sm text-slate-400">{getProviderLabel(integration.provider_id)}{providerMeta ? ` • ${providerMeta.description}` : ''}</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Encrypted Keys</p>
                                <div className="mt-2 space-y-1 text-xs text-slate-300">
                                  {Object.entries(integration.masked_credentials).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between gap-3">
                                      <span>{key}</span>
                                      <span className="font-mono text-slate-400">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Usage Tracking</p>
                                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                                  <span>{integration.usage_count} / {integration.usage_limit}</span>
                                  <span>{usagePercent}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-cyan-500',
                                    )}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Errors: {integration.error_count}{integration.last_error ? ` • ${integration.last_error}` : ''}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 lg:min-w-48">
                            <Button variant="outline" className="justify-start border-white/10 bg-white/5 text-slate-200" onClick={() => toggleIntegration(integration.api_id)}>
                              <Power className="mr-2 h-4 w-4" />
                              {integration.status === 'active' ? 'Disable' : 'Enable'}
                            </Button>
                            <Button variant="outline" className="justify-start border-white/10 bg-white/5 text-slate-200" onClick={() => recordUsage(integration.api_id, 250)}>
                              <Activity className="mr-2 h-4 w-4" />
                              Simulate Usage
                            </Button>
                            <Button variant="outline" className="justify-start border-white/10 bg-white/5 text-slate-200" onClick={() => recordError(integration.api_id, 'Webhook timeout / provider 5xx') }>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Simulate Error
                            </Button>
                            <Button variant="outline" className="justify-start border-white/10 bg-white/5 text-slate-200" onClick={() => markRecovered(integration.api_id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Mark Recovered
                            </Button>
                            <Button variant="outline" className="justify-start border-white/10 bg-white/5 text-slate-200" onClick={() => {
                              setRotationTarget(integration.api_id);
                              setRotationState(Object.fromEntries(Object.keys(integration.masked_credentials).map((key) => [key, ''])));
                            }}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Rotate Keys
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>API ID: {integration.api_id}</span>
                          <span>•</span>
                          <span>Created: {new Date(integration.created_at).toLocaleString()}</span>
                          <span>•</span>
                          <span>Updated: {new Date(integration.updated_at).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Usage Limits</CardTitle>
              <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-300">Scalable System</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.length === 0 ? (
                <p className="text-sm text-slate-500">Usage controls appear after the first integration is registered.</p>
              ) : integrations.map((integration) => (
                <div key={`${integration.api_id}-limit`} className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-[1.5fr_140px_120px] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-white">{integration.api_name}</p>
                    <p className="text-xs text-slate-500">{CATEGORY_LABELS[integration.category]} • {integration.usage_count} current usage</p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={integration.usage_limit}
                    onChange={(event) => updateUsageLimit(integration.api_id, Number(event.target.value || 0))}
                    className="border-white/10 bg-white/5 text-white"
                  />
                  <div className="text-right text-xs text-slate-500">{integration.status}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Error Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No events yet.</p>
              ) : events.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <Badge className={cn(
                      'capitalize',
                      event.severity === 'critical'
                        ? 'border-red-500/20 bg-red-500/10 text-red-400'
                        : event.severity === 'warning'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
                    )}>
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{event.message}</p>
                  <p className="mt-2 text-[11px] text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-[#0a1018] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register Integration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Provider</Label>
              <Select
                value={formState.provider_id}
                onValueChange={(value) => {
                  setSelectedProvider(value);
                  setFormState((current) => ({
                    ...current,
                    provider_id: value,
                    api_name: findProvider(value)?.providerName || current.api_name,
                  }));
                  const template = findProvider(value);
                  setCredentialState(Object.fromEntries((template?.keyFields || []).map((field) => [field.key, ''])));
                }}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_CATALOG.map((item) => (
                    <SelectItem key={item.providerId} value={item.providerId}>{item.providerName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Name</Label>
              <Input value={formState.api_name} onChange={(event) => setFormState((current) => ({ ...current, api_name: event.target.value }))} className="border-white/10 bg-white/5 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input type="number" value={formState.usage_limit} onChange={(event) => setFormState((current) => ({ ...current, usage_limit: event.target.value }))} className="border-white/10 bg-white/5 text-white" />
            </div>
            {provider?.keyFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type="password"
                  value={credentialState[field.key] || ''}
                  onChange={(event) => setCredentialState((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
            ))}
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 border-white/10 bg-white/5 text-white" placeholder="Usage purpose, environment, or routing notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={handleRegister}>
              <Save className="mr-2 h-4 w-4" />
              Save Encrypted Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rotationTarget} onOpenChange={(open) => !open && setRotationTarget(null)}>
        <DialogContent className="border-white/10 bg-[#0a1018] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Rotate Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(rotationTarget ? integrations.find((integration) => integration.api_id === rotationTarget) : null) && Object.keys(rotationState).map((field) => (
              <div key={field} className="space-y-2">
                <Label>{field}</Label>
                <Input
                  type="password"
                  value={rotationState[field] || ''}
                  onChange={(event) => setRotationState((current) => ({ ...current, [field]: event.target.value }))}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 bg-white/5 text-slate-200" onClick={() => setRotationTarget(null)}>Cancel</Button>
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => rotationTarget && handleRotate(rotationTarget)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Rotate and Re-encrypt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: React.ElementType; tone: 'cyan' | 'emerald' | 'red' | 'violet' | 'amber' }) {
  const tones = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-300',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-300',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-300',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-300',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-300',
  };

  return (
    <Card className={cn('border bg-gradient-to-br', tones[tone])}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
