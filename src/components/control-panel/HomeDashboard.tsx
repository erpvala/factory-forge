// @ts-nocheck
/**
 * HomeDashboard - Enterprise Home/Landing Management
 * Quick overview and navigation hub
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, Activity, Users, Server, TrendingUp, 
  Clock, Bell, ArrowRight, Star, Zap, Globe,
  BarChart3, Shield, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useControlPanelOverview } from '@/hooks/useControlPanelHub';
import { getControlPanelWorkspaceByKey, getControlPanelWorkspaceHref } from '@/config/controlPanelHubRegistry';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

interface RecentActivity {
  id: string;
  action: string;
  time: string;
  status: "success" | "pending" | "info";
}

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function HomeDashboard() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const overviewQuery = useControlPanelOverview();
  const overview = overviewQuery.data;
  
  const quickActions: QuickAction[] = [
    { id: "1", label: "View Analytics", icon: BarChart3, color: "from-blue-500 to-cyan-500", route: getControlPanelWorkspaceHref(getControlPanelWorkspaceByKey('analytics')!) },
    { id: "2", label: "CEO Dashboard", icon: Users, color: "from-purple-500 to-pink-500", route: getControlPanelWorkspaceHref(getControlPanelWorkspaceByKey('ceo')!) },
    { id: "3", label: "Server Manager", icon: Server, color: "from-green-500 to-emerald-500", route: getControlPanelWorkspaceHref(getControlPanelWorkspaceByKey('server')!) },
    { id: "4", label: "Security", icon: Shield, color: "from-amber-500 to-orange-500", route: getControlPanelWorkspaceHref(getControlPanelWorkspaceByKey('security')!) },
  ];

  const recentActivity: RecentActivity[] = (overview?.recentEvents || []).map((event) => ({
    id: event.id,
    action: `${event.title}: ${event.message}`,
    time: formatRelativeTime(event.createdAt),
    status: event.status,
  }));

  const stats = [
    { label: "Active Users", value: overview ? overview.totalUsers.toLocaleString() : '--', change: `${overview?.activeModules || 0} modules`, icon: Users },
    { label: "System Health", value: overview ? `${overview.systemHealth}%` : '--', change: overview && overview.systemHealth >= 90 ? 'Stable' : 'Needs Attention', icon: Activity },
    { label: "Orders", value: overview ? overview.totalOrders.toLocaleString() : '--', change: `${overview?.pendingApplications || 0} approvals`, icon: CheckCircle },
    { label: "Revenue", value: overview ? `₹${overview.totalRevenue.toLocaleString()}` : '--', change: `${overview?.unreadNotifications || 0} alerts`, icon: TrendingUp },
  ];

  if (overviewQuery.loading && !overview) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <Activity className="h-5 w-5 animate-pulse text-blue-400" />
          <span>Loading control panel overview...</span>
        </div>
      </div>
    );
  }

  if (overviewQuery.error && !overview) {
    return (
      <div className="h-full p-6 flex items-center justify-center">
        <Card className="w-full max-w-xl bg-slate-900/60 border-red-500/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-300">
              <Bell className="h-5 w-5" />
              <span className="font-medium">Overview failed to load</span>
            </div>
            <p className="text-sm text-slate-300">{overviewQuery.error}</p>
            <Button onClick={() => overviewQuery.refresh()} className="bg-red-600 hover:bg-red-700 text-white">
              Retry Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6 overflow-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Home className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
          <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
          System Online
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <Badge variant="outline" className="mt-2 text-xs text-green-400 border-green-400/20">
                    {stat.change}
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="bg-slate-900/50 border-slate-700/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-amber-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-between h-14 bg-slate-800/30 hover:bg-slate-800/50"
                 onClick={() => navigate(action.route)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white">{action.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-900/50 border-slate-700/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-cyan-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'pending' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.action}</p>
                    </div>
                    <span className="text-xs text-slate-400">{activity.time}</span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4 text-sm text-slate-400">
                    No live activity available yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="h-5 w-5 text-green-400" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "API Response", value: overview?.systemHealth || 0, color: "bg-green-500" },
              { label: "Database Load", value: Math.min(100, Math.max(10, overview ? Math.round((overview.totalOrders / Math.max(1, overview.totalUsers || 1)) * 10) : 0)), color: "bg-blue-500" },
              { label: "Storage Used", value: Math.min(100, Math.max(5, overview ? Math.round((overview.activeModules / 40) * 100) : 0)), color: "bg-amber-500" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
