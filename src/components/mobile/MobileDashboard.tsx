import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  ChevronRight,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]} text-white`}>
          {icon}
        </div>
        {trend && change && (
          <div className={`text-sm font-medium ${trendColors[trend]}`}>
            {change}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border ${colorClasses[color]} hover:shadow-md transition-all text-left`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs opacity-75">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
      </div>
    </button>
  );
};

const MobileDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹2,45,678',
      change: '+12.5%',
      trend: 'up' as const,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'green' as const
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+5.2%',
      trend: 'up' as const,
      icon: <Users className="w-5 h-5" />,
      color: 'blue' as const
    },
    {
      title: 'Total Orders',
      value: '456',
      change: '-2.1%',
      trend: 'down' as const,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'red' as const
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.8%',
      trend: 'up' as const,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'purple' as const
    }
  ];

  const quickActions = [
    {
      title: 'New Order',
      description: 'Create a new order',
      icon: <ShoppingCart className="w-5 h-5" />,
      onClick: () => console.log('New order'),
      color: 'blue' as const
    },
    {
      title: 'View Reports',
      description: 'Analytics and insights',
      icon: <TrendingUp className="w-5 h-5" />,
      onClick: () => console.log('View reports'),
      color: 'green' as const
    },
    {
      title: 'User Management',
      description: 'Manage users',
      icon: <Users className="w-5 h-5" />,
      onClick: () => console.log('User management'),
      color: 'purple' as const
    },
    {
      title: 'System Status',
      description: 'Check system health',
      icon: <Activity className="w-5 h-5" />,
      onClick: () => console.log('System status'),
      color: 'yellow' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4 text-gray-700" />
          </button>
          
          <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
        <div className="grid gap-3">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            View all
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { user: 'John Doe', action: 'Created new order', time: '2 min ago', color: 'blue' },
            { user: 'Jane Smith', action: 'Updated profile', time: '15 min ago', color: 'green' },
            { user: 'Mike Johnson', action: 'Completed payment', time: '1 hour ago', color: 'purple' },
            { user: 'Sarah Wilson', action: 'Submitted report', time: '2 hours ago', color: 'yellow' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.user} {activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Performance Overview</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Expand
          </button>
        </div>
        
        {/* Simple chart placeholder */}
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Performance chart</p>
            <p className="text-xs text-gray-500">Tap to view detailed analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
