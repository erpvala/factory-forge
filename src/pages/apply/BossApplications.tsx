// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, User,
  Briefcase, Code2, Megaphone, Building2, Handshake, ArrowLeft,
  ChevronDown, ChevronUp, Search, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { approveApplication, getApplications, rejectApplication } from '@/api/v1/apply';
import { toast } from 'sonner';

type AppStatus = 'pending' | 'approved' | 'rejected';

interface Application {
  id: string;
  user_id: string;
  requested_role: string;
  status: AppStatus;
  created_at: string;
  reviewed_at: string | null;
  application_data: Record<string, string> | null;
  full_name?: string | null;
  phone?: string | null;
  user_email?: string;
  user_status?: string | null;
  assigned_role?: string | null;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  developer: Code2,
  influencer: Megaphone,
  reseller: Handshake,
  franchise_owner: Building2,
  franchise: Building2,
  user: User,
};

const ROLE_COLORS: Record<string, string> = {
  developer: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  influencer: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  reseller: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  franchise_owner: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  franchise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  user: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const CARD_CLASS = 'rounded-2xl border border-slate-800 bg-slate-900 shadow-xl';

export default function BossApplications() {
  const navigate = useNavigate();
  const { user, isBossOwner, isPrivileged } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isBossOwner && !isPrivileged) { navigate('/access-denied'); return; }
    fetchApplications();
  }, [user, isBossOwner, isPrivileged]);

  const fetchApplications = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await getApplications();
      if (!result.success) throw new Error(result.error || 'Failed to load applications');
      setApplications((result.data?.applications || []) as Application[]);
    } catch (err: any) {
      const message = err.message || 'Failed to load applications';
      setFetchError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appId: string, action: 'approved' | 'rejected') => {
    setActionLoading(appId + action);
    try {
      const result = action === 'approved'
        ? await approveApplication(appId)
        : await rejectApplication(appId);
      if (!result.success) throw new Error(result.error || 'Action failed');
      toast.success(action === 'approved' ? '✅ Application approved!' : '❌ Application rejected');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const term = search.toLowerCase();
    const matchesSearch = !term
      || app.requested_role.includes(term)
      || app.full_name?.toLowerCase().includes(term)
      || app.user_email?.toLowerCase().includes(term)
      || app.id.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const StatusBadge = ({ status }: { status: AppStatus }) => {
    const config = {
      pending: { icon: Clock, cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Pending' },
      approved: { icon: CheckCircle2, cls: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Approved' },
      rejected: { icon: XCircle, cls: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Rejected' },
    }[status];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.cls}`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-800 to-indigo-800 px-4 py-4 shadow-xl md:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/login?redirect=%2Fcontrol-panel')}
            className="flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" /> Control Panel
          </button>
          <h1 className="flex items-center gap-2 text-xl font-semibold leading-tight">
            <Briefcase className="w-5 h-5" /> Applications
          </h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchApplications}
            disabled={loading}
            className="text-white/70 hover:text-white disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {fetchError && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4" role="alert" aria-live="assertive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-red-200">
                <AlertCircle className="h-4 w-4" /> {fetchError}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300/40 bg-transparent text-red-100 hover:bg-red-500/10"
                onClick={fetchApplications}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-left transition-all active:scale-[0.99] ${CARD_CLASS} p-4 ${
                filter === s
                  ? 'border-violet-500/60 bg-violet-500/15'
                  : 'hover:border-slate-700'
              }`}
            >
              <p className="text-3xl font-semibold leading-tight">{counts[s]}</p>
              <p className="mt-2 text-sm capitalize text-slate-300">{s === 'all' ? 'Total' : s}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${CARD_CLASS} py-12 px-6 text-center`}>
            <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <h2 className="text-2xl font-semibold leading-tight">No applications found</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
              Try changing filters, clearing search, or refresh to fetch latest requests.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setFilter('all');
                  setSearch('');
                }}
              >
                Clear Filters
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={fetchApplications}>
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => {
              const RoleIcon = ROLE_ICONS[app.requested_role] ?? User;
              const isOpen = expanded === app.id;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${CARD_CLASS} overflow-hidden transition-all hover:border-slate-700`}
                >
                  <div className="cursor-pointer p-4 flex flex-wrap items-center gap-3 md:p-5"
                    onClick={() => setExpanded(isOpen ? null : app.id)}>
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <RoleIcon className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium leading-tight">
                        {app.full_name || 'Unknown User'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        ID: {app.user_id?.slice(0, 8)}... · {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      {app.user_email && (
                        <p className="mt-1 truncate text-xs text-slate-300">{app.user_email}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${ROLE_COLORS[app.requested_role] || ROLE_COLORS.user}`}>
                      {app.requested_role}
                    </span>
                    <StatusBadge status={app.status} />
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800 p-4 space-y-4 md:p-5"
                    >
                      {/* Application data */}
                      {app.application_data && Object.keys(app.application_data).length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Application Details</p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {Object.entries(app.application_data).map(([key, val]) => (
                              <div key={key} className="rounded-lg bg-slate-800 p-2.5">
                                <p className="text-[10px] text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                <p className="text-xs text-slate-200 mt-0.5 truncate">{val || '—'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-800 p-2.5">
                          <p className="text-[10px] text-slate-500">Assigned Role</p>
                          <p className="text-xs text-slate-200 mt-0.5">{app.assigned_role || 'Pending'}</p>
                        </div>
                        <div className="rounded-lg bg-slate-800 p-2.5">
                          <p className="text-[10px] text-slate-500">User Status</p>
                          <p className="text-xs text-slate-200 mt-0.5">{app.user_status || 'Unknown'}</p>
                        </div>
                        <div className="rounded-lg bg-slate-800 p-2.5">
                          <p className="text-[10px] text-slate-500">Phone</p>
                          <p className="text-xs text-slate-200 mt-0.5">{app.phone || '—'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {app.status === 'pending' && (
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            disabled={!!actionLoading}
                            onClick={() => handleAction(app.id, 'approved')}
                          >
                            {actionLoading === app.id + 'approved' ? (
                              <span className="flex items-center gap-2"><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Approving...</span>
                            ) : (
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</span>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/40 text-red-400 hover:bg-red-500/10 flex-1"
                            disabled={!!actionLoading}
                            onClick={() => handleAction(app.id, 'rejected')}
                          >
                            {actionLoading === app.id + 'rejected' ? (
                              <span className="flex items-center gap-2"><div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" /> Rejecting...</span>
                            ) : (
                              <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Reject</span>
                            )}
                          </Button>
                        </div>
                      )}

                      {app.status !== 'pending' && (
                        <p className="text-xs text-slate-500">
                          {app.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          {app.reviewed_at ? ` on ${new Date(app.reviewed_at).toLocaleDateString()}` : ''}
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
