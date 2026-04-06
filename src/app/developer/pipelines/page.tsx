// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MoreHorizontal,
  GitBranch,
  GitCommit,
  Calendar,
  Activity,
  Settings
} from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'canceled';
  project: string;
  branch: string;
  commit: {
    hash: string;
    message: string;
    author: string;
  };
  stages: PipelineStage[];
  duration: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  triggeredBy: string;
}

interface PipelineStage {
  name: string;
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped';
  duration?: number;
  logs?: string;
}

const DeveloperPipelinesPage: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoPipelines: Pipeline[] = [
      {
        id: 'pipe_1',
        name: 'Build and Deploy',
        status: 'running',
        project: 'ecommerce-frontend',
        branch: 'main',
        commit: {
          hash: 'a3f4b8c',
          message: 'Fix checkout page validation',
          author: 'John Developer'
        },
        stages: [
          { name: 'Build', status: 'success', duration: 120 },
          { name: 'Test', status: 'success', duration: 180 },
          { name: 'Deploy', status: 'running' }
        ],
        duration: 0,
        createdAt: '10 minutes ago',
        startedAt: '8 minutes ago',
        triggeredBy: 'John Developer'
      },
      {
        id: 'pipe_2',
        name: 'CI/CD Pipeline',
        status: 'success',
        project: 'mobile-api-backend',
        branch: 'feature/auth',
        commit: {
          hash: 'f7d2e9a',
          message: 'Add user authentication endpoints',
          author: 'John Developer'
        },
        stages: [
          { name: 'Lint', status: 'success', duration: 45 },
          { name: 'Test', status: 'success', duration: 120 },
          { name: 'Build', status: 'success', duration: 90 },
          { name: 'Deploy to Staging', status: 'success', duration: 150 }
        ],
        duration: 405,
        createdAt: '2 hours ago',
        startedAt: '2 hours ago',
        completedAt: '1 hour 55 minutes ago',
        triggeredBy: 'Push to feature/auth'
      },
      {
        id: 'pipe_3',
        name: 'Test Pipeline',
        status: 'failed',
        project: 'analytics-dashboard',
        branch: 'main',
        commit: {
          hash: 'b5c1d4e',
          message: 'Update ML model for better predictions',
          author: 'Jane Smith'
        },
        stages: [
          { name: 'Build', status: 'success', duration: 200 },
          { name: 'Test', status: 'failed', duration: 300 }
        ],
        duration: 500,
        createdAt: '4 hours ago',
        startedAt: '4 hours ago',
        completedAt: '3 hours 50 minutes ago',
        triggeredBy: 'Push to main'
      },
      {
        id: 'pipe_4',
        name: 'Deploy Pipeline',
        status: 'pending',
        project: 'devops-automation',
        branch: 'main',
        commit: {
          hash: 'c9e8f7a',
          message: 'Add production environment configuration',
          author: 'DevOps Team'
        },
        stages: [
          { name: 'Validate Config', status: 'pending' },
          { name: 'Deploy', status: 'pending' },
          { name: 'Verify', status: 'pending' }
        ],
        duration: 0,
        createdAt: '30 minutes ago',
        triggeredBy: 'Manual trigger'
      }
    ];

    setTimeout(() => {
      setPipelines(demoPipelines);
      setLoading(false);
    }, 800);
  }, []);

  const filteredPipelines = pipelines.filter(pipeline => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.commit.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pipeline.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'running': 'bg-blue-100 text-blue-800',
      'success': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'canceled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'skipped':
        return <Square className="h-3 w-3 text-gray-500" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Running...';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pipelines...</p>
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
            <h1 className="text-3xl font-bold">Pipelines</h1>
            <p className="text-muted-foreground">Monitor and manage CI/CD pipelines</p>
          </div>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Run Pipeline
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Status: {filterStatus}
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pipelines.filter(p => p.status === 'running').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {pipelines.filter(p => p.status === 'success').length}
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
                {pipelines.filter(p => p.status === 'failed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pipelines.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipelines List */}
        <div className="space-y-4">
          {filteredPipelines.map((pipeline) => (
            <Card key={pipeline.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pipeline.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{pipeline.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pipeline.project} • {pipeline.branch}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(pipeline.status)}>
                      {pipeline.status}
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
                      {pipeline.commit.hash}
                    </Badge>
                    <span>{pipeline.commit.message}</span>
                    <span>•</span>
                    <span>{pipeline.commit.author}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {pipeline.createdAt}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span>Duration: {formatDuration(pipeline.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Settings className="h-4 w-4" />
                      <span>Triggered by: {pipeline.triggeredBy}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Stages:</span>
                    <div className="flex-1 flex items-center space-x-2">
                      {pipeline.stages.map((stage, index) => (
                        <React.Fragment key={stage.name}>
                          <div className="flex items-center space-x-1">
                            {getStageIcon(stage.status)}
                            <span className="text-sm">{stage.name}</span>
                            {stage.duration && (
                              <span className="text-xs text-muted-foreground">
                                ({stage.duration}s)
                              </span>
                            )}
                          </div>
                          {index < pipeline.stages.length - 1 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    {pipeline.status === 'running' && (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {pipeline.status === 'failed' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
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

        {filteredPipelines.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pipelines found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first pipeline to get started'}
            </p>
            {!searchTerm && (
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Create Pipeline
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperPipelinesPage;
