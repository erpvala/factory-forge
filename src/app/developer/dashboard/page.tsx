// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { callEdgeRoute } from '@/lib/api/edge-client';
import { 
  Code, 
  GitBranch, 
  Package, 
  Activity, 
  Cloud, 
  FileText, 
  AlertTriangle, 
  Settings,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  lastCommit: string;
  commits: number;
  branches: number;
  pipelineStatus: 'running' | 'success' | 'failed';
  deployments: number;
}

interface Pipeline {
  id: string;
  projectId: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  branch: string;
  commit: string;
  duration: number;
  timestamp: number;
}

interface Deployment {
  id: string;
  projectId: string;
  environment: 'staging' | 'production';
  status: 'deploying' | 'deployed' | 'failed';
  version: string;
  timestamp: number;
}

const DeveloperDashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load real developer data
    const loadDeveloperData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user || null);
        
        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('developer_projects')
          .select('*')
          .eq('developer_id', userData?.user?.id)
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        
        // Load pipelines
        const { data: pipelinesData, error: pipelinesError } = await supabase
          .from('developer_pipelines')
          .select('*')
          .eq('developer_id', userData?.user?.id)
          .order('created_at', { ascending: false });
        
        if (pipelinesError) throw pipelinesError;
        
        // Load deployments
        const { data: deploymentsData, error: deploymentsError } = await supabase
          .from('developer_deployments')
          .select('*')
          .eq('developer_id', userData?.user?.id)
          .order('created_at', { ascending: false });
        
        if (deploymentsError) throw deploymentsError;
        
        // Load commits
        const { data: commitsData, error: commitsError } = await supabase
          .from('developer_commits')
          .select('*')
          .eq('developer_id', userData?.user?.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (commitsError) throw commitsError;
        
        setProjects(projectsData || []);
        setPipelines(pipelinesData || []);
        setDeployments(deploymentsData || []);
        setCommits(commitsData || []);
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          action: 'developer_dashboard_loaded',
          module: 'developer_dashboard',
          user_id: userData?.user?.id,
          metadata: { 
            projects_count: projectsData?.length || 0,
            pipelines_count: pipelinesData?.length || 0
          }
        });
        
      } catch (error) {
        console.error('Error loading developer dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeveloperData();
  }, []);

  // Handle new project creation
  const handleNewProject = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('developer_projects')
        .insert({
          name: 'New Project',
          status: 'development',
          progress: 0,
          developer_id: userData?.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProjects(prev => [data, ...prev]);
      
      // Log audit trail
      await supabase.from('audit_logs').insert({
        action: 'project_created',
        module: 'developer_dashboard',
        user_id: userData?.user?.id,
        metadata: { project_id: data.id }
      });
      
      // Navigate to project detail
      router.push(`/developer/projects/${data.id}`);
      
    } catch (error) {
      console.error('Error creating new project:', error);
    }
  };
  
  // Handle project click
  const handleProjectClick = (projectId: string) => {
    router.push(`/developer/projects/${projectId}`);
  };
  
  // Handle pipeline click
  const handlePipelineClick = (pipelineId: string) => {
    router.push(`/developer/pipelines/${pipelineId}`);
  };
  
  // Handle deployment click
  const handleDeploymentClick = (deploymentId: string) => {
    router.push(`/developer/deployments/${deploymentId}`);
  };
  
  // Handle commit click
  const handleCommitClick = (commitId: string) => {
    router.push(`/developer/commits/${commitId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'deployed':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
      case 'deploying':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      failed: 'destructive',
      running: 'outline',
      deploying: 'outline',
      deployed: 'default',
      active: 'default',
      inactive: 'secondary',
      archived: 'secondary'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Developer Dashboard...</p>
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
            <h1 className="text-3xl font-bold">Developer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={handleNewProject}>
            <Code className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pipelines.filter(p => p.status === 'running').length}
              </div>
              <p className="text-xs text-muted-foreground">3 in progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployments</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deployments.length}</div>
              <p className="text-xs text-muted-foreground">2 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + p.commits, 0)}
              </div>
              <p className="text-xs text-muted-foreground">+47 today</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50" onClick={() => handleProjectClick(project.id)}>
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(project.status)}
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Last commit: {project.lastCommit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{project.commits} commits</p>
                      <p className="text-sm text-muted-foreground">{project.branches} branches</p>
                    </div>
                    {getStatusBadge(project.pipelineStatus)}
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleProjectClick(project.id); }}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pipelines.slice(0, 3).map((pipeline) => (
                  <div key={pipeline.id} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => handlePipelineClick(pipeline.id)}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(pipeline.status)}
                      <div>
                        <p className="text-sm font-medium">{pipeline.branch}</p>
                        <p className="text-xs text-muted-foreground">
                          Commit: {pipeline.commit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{pipeline.duration}s</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pipeline.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deployments.slice(0, 3).map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded" onClick={() => handleDeploymentClick(deployment.id)}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <p className="text-sm font-medium">{deployment.environment}</p>
                        <p className="text-xs text-muted-foreground">
                          Version: {deployment.version}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(deployment.status)}
                      <p className="text-xs text-muted-foreground">
                        {new Date(deployment.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboardPage;
