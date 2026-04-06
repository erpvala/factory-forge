// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Code, 
  Play, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Globe,
  Shield,
  Key,
  Zap,
  FileText,
  Terminal
} from 'lucide-react';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  status: 'active' | 'deprecated' | 'disabled';
  responseTime: number;
  successRate: number;
  totalRequests: number;
  lastUsed: string;
  authentication: 'none' | 'api-key' | 'jwt' | 'oauth';
  rateLimit: {
    requests: number;
    window: string;
  };
  documentation?: string;
}

const DeveloperApiPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoEndpoints: ApiEndpoint[] = [
      {
        id: 'api_1',
        method: 'GET',
        path: '/api/v1/users',
        description: 'Get list of users with pagination',
        status: 'active',
        responseTime: 120,
        successRate: 99.5,
        totalRequests: 15420,
        lastUsed: '2 minutes ago',
        authentication: 'jwt',
        rateLimit: {
          requests: 1000,
          window: '1h'
        },
        documentation: 'Returns a paginated list of users. Supports filtering by role and status.'
      },
      {
        id: 'api_2',
        method: 'POST',
        path: '/api/v1/auth/login',
        description: 'Authenticate user and return JWT token',
        status: 'active',
        responseTime: 85,
        successRate: 98.2,
        totalRequests: 8934,
        lastUsed: '5 minutes ago',
        authentication: 'none',
        rateLimit: {
          requests: 100,
          window: '15m'
        }
      },
      {
        id: 'api_3',
        method: 'PUT',
        path: '/api/v1/projects/{id}',
        description: 'Update project details',
        status: 'active',
        responseTime: 150,
        successRate: 97.8,
        totalRequests: 3456,
        lastUsed: '1 hour ago',
        authentication: 'jwt',
        rateLimit: {
          requests: 500,
          window: '1h'
        }
      },
      {
        id: 'api_4',
        method: 'GET',
        path: '/api/v1/analytics/dashboard',
        description: 'Get dashboard analytics data',
        status: 'active',
        responseTime: 200,
        successRate: 99.1,
        totalRequests: 6789,
        lastUsed: '30 minutes ago',
        authentication: 'api-key',
        rateLimit: {
          requests: 200,
          window: '1h'
        }
      },
      {
        id: 'api_5',
        method: 'DELETE',
        path: '/api/v1/users/{id}',
        description: 'Delete user account',
        status: 'deprecated',
        responseTime: 95,
        successRate: 96.5,
        totalRequests: 234,
        lastUsed: '2 days ago',
        authentication: 'jwt',
        rateLimit: {
          requests: 50,
          window: '1h'
        }
      }
    ];

    setTimeout(() => {
      setEndpoints(demoEndpoints);
      setLoading(false);
    }, 800);
  }, []);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || endpoint.method === filterMethod;
    const matchesStatus = filterStatus === 'all' || endpoint.status === filterStatus;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 text-green-800',
      'POST': 'bg-blue-100 text-blue-800',
      'PUT': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'PATCH': 'bg-purple-100 text-purple-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deprecated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'disabled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'deprecated': 'bg-yellow-100 text-yellow-800',
      'disabled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAuthIcon = (auth: string) => {
    switch (auth) {
      case 'jwt':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'api-key':
        return <Key className="h-4 w-4 text-green-500" />;
      case 'oauth':
        return <Globe className="h-4 w-4 text-purple-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API endpoints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground">Explore and test API endpoints</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Docs
            </Button>
            <Button>
              <Terminal className="h-4 w-4 mr-2" />
              API Console
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Code className="h-4 w-4 mr-2" />
            Method: {filterMethod}
          </Button>
          <Button variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Status: {filterStatus}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
              <Code className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {endpoints.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {endpoints.filter(e => e.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(endpoints.reduce((sum, e) => sum + e.responseTime, 0) / endpoints.length)}ms
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Globe className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {endpoints.reduce((sum, e) => sum + e.totalRequests, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredEndpoints.map((endpoint) => (
            <Card key={endpoint.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <div>
                      <h3 className="text-lg font-semibold font-mono">{endpoint.path}</h3>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(endpoint.status)}
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold">{endpoint.responseTime}ms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-semibold">{endpoint.successRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-lg font-semibold">{endpoint.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-lg font-semibold">{endpoint.lastUsed}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getAuthIcon(endpoint.authentication)}
                      <span className="text-sm text-muted-foreground">
                        {endpoint.authentication.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rate Limit: {endpoint.rateLimit.requests}/{endpoint.rateLimit.window}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Docs
                    </Button>
                  </div>
                </div>

                {endpoint.documentation && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    <p className="text-sm">{endpoint.documentation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperApiPage;
