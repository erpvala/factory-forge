// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { 
  Brain, 
  Cpu, 
  Zap, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export default function ValaAIPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState({
    status: 'offline',
    uptime: 0,
    processing_power: 0,
    memory_usage: 0,
    active_processes: 0,
    completed_tasks: 0,
    error_rate: 0
  });
  const [aiModels, setAiModels] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load real VALA-AI data
  useEffect(() => {
    const loadValaAIData = async () => {
      try {
        setIsLoading(true);
        
        // Load AI status
        const { data: aiStatusData, error: statusError } = await supabase
          .from('vala_ai_status')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (statusError && statusError.code !== 'PGRST116') throw statusError;
        
        // Load AI models
        const { data: modelsData, error: modelsError } = await supabase
          .from('vala_ai_models')
          .select('*')
          .eq('status', 'active');
        
        if (modelsError) throw modelsError;
        
        // Load active projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('vala_ai_projects')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (projectsError) throw projectsError;
        
        // Load system metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('vala_ai_metrics')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10);
        
        if (metricsError) throw metricsError;
        
        // Set state with real data
        if (aiStatusData && aiStatusData.length > 0) {
          setAiStatus(aiStatusData[0]);
        } else {
          // Initialize with default values if no data exists
          setAiStatus({
            status: 'online',
            uptime: 0,
            processing_power: 75,
            memory_usage: 60,
            active_processes: 3,
            completed_tasks: 0,
            error_rate: 0.1
          });
        }
        
        setAiModels(modelsData || []);
        setActiveProjects(projectsData || []);
        setSystemMetrics(metricsData || []);
        
        // Log audit trail
        await supabase.from('audit_logs').insert({
          action: 'vala_ai_dashboard_loaded',
          module: 'vala_ai',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metadata: { 
            status: aiStatusData?.[0]?.status || 'initialized',
            models_count: modelsData?.length || 0,
            projects_count: projectsData?.length || 0
          }
        });
        
      } catch (error) {
        console.error('Error loading VALA-AI data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValaAIData();
    
    // Set up real-time updates
    const subscription = supabase
      .channel('vala-ai-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vala_ai_status' },
        () => loadValaAIData()
      )
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, []);

  // Handle AI system control
  const handleAiControl = async (action: string) => {
    try {
      setIsProcessing(true);

      const res = await fetch('/api/v1/vala-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, payload: { source: 'vala-ai-control-center' } }),
      });
      const response = await res.json().catch(() => ({}));

      if (res.ok && response.success) {
        setAiStatus(prev => ({
          ...prev,
          status: action === 'start' ? 'online' : action === 'stop' ? 'offline' : prev.status
        }));

        await supabase.from('audit_logs').insert({
          action: `vala_ai_${action}`,
          module: 'vala_ai',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metadata: { action, success: true, event_id: response.event_id }
        });
      }

    } catch (error) {
      console.error(`Error ${action}ing VALA-AI:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle model training
  const handleModelTraining = async (modelId: string) => {
    try {
      setIsProcessing(true);

      const res = await fetch('/api/v1/vala-ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'train-model', payload: { model_id: modelId } }),
      });
      const response = await res.json().catch(() => ({}));

      if (res.ok && response.success) {
        await supabase.from('audit_logs').insert({
          action: 'vala_ai_model_training_started',
          module: 'vala_ai',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metadata: { model_id: modelId, event_id: response.event_id }
        });
      }

    } catch (error) {
      console.error('Error starting model training:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-10 w-10 text-purple-400" />
            VALA-AI Control Center
          </h1>
          <p className="text-purple-200">Advanced AI system management and monitoring</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{aiStatus.status}</span>
                <Badge className={aiStatus.status === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                  {aiStatus.status === 'online' ? 'Active' : 'Offline'}
                </Badge>
              </div>
              <p className="text-sm text-purple-200 mt-2">Uptime: {aiStatus.uptime}h</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Processing Power
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStatus.processing_power}%</div>
              <Progress value={aiStatus.processing_power} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Processes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStatus.active_processes}</div>
              <p className="text-sm text-purple-200 mt-2">Running tasks</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiStatus.completed_tasks}</div>
              <p className="text-sm text-purple-200 mt-2">Total completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="mb-8">
          <Card className="bg-purple-800/50 border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Control
              </CardTitle>
              <CardDescription>Control VALA-AI system operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleAiControl('start')}
                  disabled={aiStatus.status === 'online' || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start AI
                </Button>
                <Button 
                  onClick={() => handleAiControl('stop')}
                  disabled={aiStatus.status === 'offline' || isProcessing}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop AI
                </Button>
                <Button 
                  onClick={() => handleAiControl('restart')}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-purple-800/50">
            <TabsTrigger value="models" className="data-[state=active]:bg-purple-700">
              AI Models
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-700">
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-purple-700">
              System Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <Card className="bg-purple-800/50 border-purple-700">
              <CardHeader>
                <CardTitle>AI Models</CardTitle>
                <CardDescription>Manage and train AI models</CardDescription>
              </CardHeader>
              <CardContent>
                {aiModels.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No active AI models found. Initialize models to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {aiModels.map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-4 bg-purple-900/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-purple-200">{model.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                          <Button 
                            size="sm"
                            onClick={() => handleModelTraining(model.id)}
                            disabled={isProcessing}
                          >
                            Train
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="bg-purple-800/50 border-purple-700">
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Monitor ongoing AI projects</CardDescription>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No active projects. Create a new project to begin.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div key={project.id} className="p-4 bg-purple-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge className="bg-blue-500">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-200 mb-2">{project.description}</p>
                        <Progress value={project.progress || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card className="bg-purple-800/50 border-purple-700">
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-900/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Memory Usage</h4>
                      <div className="text-2xl font-bold">{aiStatus.memory_usage}%</div>
                      <Progress value={aiStatus.memory_usage} className="mt-2" />
                    </div>
                    <div className="p-4 bg-purple-900/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Error Rate</h4>
                      <div className="text-2xl font-bold">{aiStatus.error_rate}%</div>
                      <Progress value={aiStatus.error_rate} className="mt-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
