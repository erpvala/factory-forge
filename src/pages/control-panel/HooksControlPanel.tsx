import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHookJobs, getHookLogs, getHooksRegistry, retryHookJob, triggerGlobalHooks } from '@/lib/hooks/globalHookSystem';

const HooksControlPanel = () => {
  const [logs, setLogs] = useState(() => getHookLogs(100));
  const [jobs, setJobs] = useState(() => getHookJobs(100));
  const [triggering, setTriggering] = useState(false);

  const registry = useMemo(() => getHooksRegistry(), []);

  useEffect(() => {
    const refresh = () => {
      setLogs(getHookLogs(100));
      setJobs(getHookJobs(100));
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener('sv:hook-log', refresh as EventListener);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('sv:hook-log', refresh as EventListener);
    };
  }, []);

  const failedJobs = jobs.filter((job) => job.status === 'failed');
  const runningJobs = jobs.filter((job) => job.status === 'running');

  const handleManualTrigger = async () => {
    setTriggering(true);
    try {
      await triggerGlobalHooks({
        event: 'order_paid',
        module: 'orders',
        payload: {
          order_id: `manual_${Date.now()}`,
          amount: 0,
        },
      });
      setLogs(getHookLogs(100));
      setJobs(getHookJobs(100));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Hook Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button onClick={handleManualTrigger} disabled={triggering}>
            {triggering ? 'Triggering...' : 'Manual Trigger (order_paid)'}
          </Button>
          <div className="text-sm text-muted-foreground">
            Running: {runningJobs.length} | Failed: {failedJobs.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hooks Registry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {registry.map((entry) => (
            <div key={entry.id} className="rounded border p-2">
              <div>{entry.id}</div>
              <div className="text-muted-foreground">
                event={entry.event} | module={entry.module} | priority={entry.priority} | mode={entry.mode} | action={entry.action}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Failed Hook Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {failedJobs.length === 0 && <div className="text-muted-foreground">No failed hooks.</div>}
          {failedJobs.map((job) => (
            <div key={job.id} className="rounded border p-2 flex items-center justify-between gap-4">
              <div>
                <div>{job.action} ({job.event})</div>
                <div className="text-muted-foreground">trace_id={job.trace_id} retry_count={job.retry_count} error={job.error || '-'}</div>
              </div>
              <Button
                variant="secondary"
                onClick={async () => {
                  await retryHookJob(job.id);
                  setLogs(getHookLogs(100));
                  setJobs(getHookJobs(100));
                }}
              >
                Retry
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hook Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {logs.map((log) => (
            <div key={log.id} className="rounded border p-2">
              <div>{log.status.toUpperCase()} | {log.event} | {log.action || 'n/a'}</div>
              <div className="text-muted-foreground">module={log.module} trace_id={log.trace_id} at={log.created_at}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default HooksControlPanel;
