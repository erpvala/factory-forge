// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Cloud, 
  Server, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  MoreHorizontal,
  GitBranch,
  GitCommit,
  Calendar,
  Activity,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

interface Deployment {
  id: string;
  version: string;
  status: 'deploying' | 'deployed' | 'failed' | 'pending' | 'rolling_back';
  environment: 'development' | 'staging' | 'production';
  project: string;
  branch: string;
  commit: {
    hash: string;
    message: string;
    author: string;
  };
  server: string;
  url?: string;
  duration: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deployedBy: string;
  healthCheck: 'passing' | 'failing' | 'pending';
  metrics?: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
  };
}

const DeveloperDeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoDeployments: Deployment[] = [
      {
        id: 'deploy_1',
        version: 'v2.3.1',
        status: 'deployed',
        environment: 'production',
        project: 'ecommerce-frontend',
        branch: 'main',
        commit: {
          hash: 'a3f4b8c',
          message: 'Fix checkout page validation',
          author: 'John Developer'
        },
        server: 'prod-server-01',
        url: 'https://ecommerce.company.com',
        duration: 245,
        createdAt: '2 hours ago',
        startedAt: '2 hours ago',
        completedAt: '1 hour 55 minutes ago',
        deployedBy: 'John Developer',
        healthCheck: 'passing',
        metrics: {
          cpu: 45,
          memory: 62,
          requests: 1250,
          errors: 2
        }
      },
      {
        id: 'deploy_2',
        version: 'v1.8.0-beta',
        status: 'deploying',
        environment: 'staging',
        project: 'mobile-api-backend',
        branch: 'feature/auth',
        commit: {
          hash: 'f7d2e9a',
          message: 'Add user authentication endpoints',
          author: 'John Developer'
        },
        server: 'staging-server-02',
        url: 'https://api-staging.company.com',
        duration: 0,
        createdAt: '30 minutes ago',
        startedAt: '25 minutes ago',
        deployedBy: 'CI/CD Pipeline',
        healthCheck: 'pending'
      },
      {
        id: 'deploy_3',
        version: 'v1.5.2',
        status: 'failed',
        environment: 'production',
        project: 'analytics-dashboard',
        branch: 'main',
        commit: {
          hash: 'b5c1d4e',
          message: 'Update ML model for better predictions',
          author: 'Jane Smith'
        },
        server: 'prod-server-03',
        duration: 180,
        createdAt: '4 hours ago',
        startedAt: '4 hours ago',
        completedAt: '3 hours 55 minutes ago',
        deployedBy: 'Jane Smith',
        healthCheck: 'failing'
      },
      {
        id: 'deploy_4',
        version: 'v0.9.0',
        status: 'rolling_back',
        environment: 'production',
        project: 'devops-automation',
        branch: 'main',
        commit: {
          hash: 'c9e8f7a',
          message: 'Add production environment configuration',
          author: 'DevOps Team'
        },
        server: 'prod-server-04',
        duration: 0,
        createdAt: '1 hour ago',
        startedAt: '55 minutes ago',
        deployedBy: 'Auto Rollback',
        healthCheck: 'failing'
      }
    ];

    setTimeout(() => {
      setDeployments(demoDeployments);
      setLoading(false);
    }, 800);
  }, []);

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.commit.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnvironment = filterEnvironment === 'all' || deployment.environment === filterEnvironment;
    return matchesSearch && matchesEnvironment;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deploying':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rolling_back':
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'deploying': 'bg-blue-100 text-blue-800',
      'deployed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'rolling_back': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getEnvironmentColor = (environment: string) => {
    const colors: Record<string, string> = {
      'development': 'bg-gray-100 text-gray-800',
      'staging': 'bg-blue-100 text-blue-800',
      'production': 'bg-green-100 text-green-800'
    };
    return colors[environment] || 'bg-gray-100 text-gray-800';
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'passing':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'In progress...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deployments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Deployments</h1>
            <p className="text-muted-foreground">Monitor and manage application deployments</p>
          </div>
          <Button>
            <Cloud className="h-4 w-4 mr-2" />
            New Deployment
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Server className="h-4 w-4 mr-2" />
            Environment: {filterEnvironment}
          </Button>
        </div>

        {/* Deployment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deploying</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {deployments.filter(d => d.status === 'deploying').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {deployments.filter(d => d.status === 'deployed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {deployments.filter(d => d.status === 'failed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rolling Back</CardTitle>
              <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {deployments.filter(d => d.status === 'rolling_back').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deployments List */}
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <Card key={deployment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{deployment.version}</h3>
                      <p className="text-sm text-muted-foreground">
                        {deployment.project} • {deployment.branch}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getEnvironmentColor(deployment.environment)}>
                      {deployment.environment}
                    </Badge>
                    <Badge className={getStatusColor(deployment.status)}>
                      {deployment.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                    <GitCommit className="h-4 w-4" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {deployment.commit.hash}
                    </Badge>
                    <span>{deployment.commit.message}</span>
                    <span>•</span>
                    <span>{deployment.commit.author}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Server className="h-4 w-4" />
                      <span>{deployment.server}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {deployment.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span>Duration: {formatDuration(deployment.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>By: {deployment.deployedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Health Check and Metrics */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Health Check:</span>
                      {getHealthIcon(deployment.healthCheck)}
                      <Badge variant={deployment.healthCheck === 'passing' ? 'default' : 'destructive'}>
                        {deployment.healthCheck}
                      </Badge>
                    </div>
                    {deployment.url && (
                      <Button variant="outline" size="sm">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit App
                      </Button>
                    )}
                  </div>
                  
                  {deployment.metrics && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>CPU: {deployment.metrics.cpu}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span>Memory: {deployment.metrics.memory}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span>Requests: {deployment.metrics.requests}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Errors: {deployment.metrics.errors}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {deployment.status === 'deploying' && (
                      <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                    {deployment.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    )}
                    {deployment.status === 'deployed' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDeployments.length === 0 && (
          <div className="text-center py-12">
            <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deployments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first deployment to get started'}
            </p>
            {!searchTerm && (
              <Button>
                <Cloud className="h-4 w-4 mr-2" />
                Create Deployment
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperDeploymentsPage;
