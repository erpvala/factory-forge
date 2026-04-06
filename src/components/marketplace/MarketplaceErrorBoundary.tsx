// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class MarketplaceErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[MarketplaceErrorBoundary] crash captured', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-3">
            <h1 className="text-xl font-semibold">Marketplace temporary issue</h1>
            <p className="text-sm text-red-100/80">The marketplace UI failed safely. You can retry without losing your session.</p>
            <Button onClick={this.handleReset} className="w-full">Retry marketplace</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
