// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InternalServerErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold">500 - Internal Error</h1>
        <p className="text-slate-300">
          Something went wrong while loading this route. Try again, or return to a stable page.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          <Button asChild variant="outline" className="gap-2 border-slate-700 bg-slate-950 hover:bg-slate-900">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
