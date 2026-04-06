// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeveloperState {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    lastCommit: string;
    commits: number;
    branches: number;
    pipelineStatus: string;
    deployments: number;
  }>;
  repositories: Array<{
    id: string;
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    defaultBranch: string;
    lastCommit: {
      message: string;
      author: string;
      timestamp: string;
      hash: string;
    };
    visibility: string;
    createdAt: string;
  }>;
  commits: Array<{
    id: string;
    hash: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
    repository: string;
    branch: string;
    additions: number;
    deletions: number;
    files: number;
    status: string;
    pullRequest?: {
      id: string;
      number: number;
      title: string;
    };
  }>;
  pipelines: Array<{
    id: string;
    name: string;
    status: string;
    project: string;
    branch: string;
    commit: {
      hash: string;
      message: string;
      author: string;
    };
    stages: Array<{
      name: string;
      status: string;
      duration?: number;
      logs?: string;
    }>;
    duration: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    triggeredBy: string;
  }>;
  deployments: Array<{
    id: string;
    version: string;
    status: string;
    environment: string;
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
    healthCheck: string;
    metrics?: {
      cpu: number;
      memory: number;
      requests: number;
      errors: number;
    };
  }>;
  logs: Array<{
    id: string;
    timestamp: string;
    level: string;
    message: string;
    source: string;
    service: string;
    environment: string;
    metadata?: {
      userId?: string;
      requestId?: string;
      ip?: string;
    };
    details?: string;
  }>;
  errors: Array<{
    id: string;
    timestamp: string;
    level: string;
    message: string;
    stackTrace?: string;
    source: string;
    service: string;
    environment: string;
    occurrences: number;
    firstSeen: string;
    lastSeen: string;
    status: string;
    assignedTo?: string;
    metadata?: {
      userId?: string;
      requestId?: string;
      ip?: string;
    };
  }>;
  loading: boolean;
  error: string | null;
}

const useDeveloperState = () => {
  const [state, setState] = useState<DeveloperState>({
    user: null,
    projects: [],
    repositories: [],
    commits: [],
    pipelines: [],
    deployments: [],
    logs: [],
    errors: [],
    loading: true,
    error: null
  });

  // Initialize demo data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoUser = {
          id: 'dev_1',
          name: 'John Developer',
          email: 'john@company.com',
          role: 'developer',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        };

        const demoProjects = [
          {
            id: 'proj_1',
            name: 'E-commerce Platform',
            description: 'React-based e-commerce solution',
            status: 'active',
            lastCommit: '2 hours ago',
            commits: 234,
            branches: 8,
            pipelineStatus: 'success',
            deployments: 12
          },
          {
            id: 'proj_2',
            name: 'Mobile API Backend',
            description: 'Node.js REST API for mobile apps',
            status: 'active',
            lastCommit: '5 hours ago',
            commits: 156,
            branches: 5,
            pipelineStatus: 'running',
            deployments: 8
          },
          {
            id: 'proj_3',
            name: 'Data Analytics Dashboard',
            description: 'Python-based analytics platform',
            status: 'active',
            lastCommit: '1 day ago',
            commits: 89,
            branches: 3,
            pipelineStatus: 'failed',
            deployments: 5
          }
        ];

        const demoRepositories = [
          {
            id: 'repo_1',
            name: 'ecommerce-frontend',
            description: 'React-based e-commerce frontend application',
            language: 'React',
            stars: 145,
            forks: 23,
            watchers: 18,
            openIssues: 3,
            defaultBranch: 'main',
            lastCommit: {
              message: 'Fix checkout page validation',
              author: 'John Developer',
              timestamp: '2 hours ago',
              hash: 'a3f4b8c'
            },
            visibility: 'public',
            createdAt: '3 months ago'
          },
          {
            id: 'repo_2',
            name: 'mobile-api-backend',
            description: 'Node.js REST API for mobile applications',
            language: 'Node.js',
            stars: 89,
            forks: 12,
            watchers: 7,
            openIssues: 1,
            defaultBranch: 'main',
            lastCommit: {
              message: 'Add user authentication endpoints',
              author: 'John Developer',
              timestamp: '5 hours ago',
              hash: 'f7d2e9a'
            },
            visibility: 'private',
            createdAt: '6 months ago'
          }
        ];

        const demoCommits = [
          {
            id: 'commit_1',
            hash: 'a3f4b8c',
            message: 'Fix checkout page validation and improve error handling',
            author: {
              name: 'John Developer',
              email: 'john@company.com'
            },
            timestamp: '2 hours ago',
            repository: 'ecommerce-frontend',
            branch: 'main',
            additions: 45,
            deletions: 12,
            files: 3,
            status: 'modified',
            pullRequest: {
              id: 'pr_1',
              number: 234,
              title: 'Fix checkout validation'
            }
          },
          {
            id: 'commit_2',
            hash: 'f7d2e9a',
            message: 'Add user authentication endpoints with JWT support',
            author: {
              name: 'John Developer',
              email: 'john@company.com'
            },
            timestamp: '5 hours ago',
            repository: 'mobile-api-backend',
            branch: 'feature/auth',
            additions: 128,
            deletions: 8,
            files: 7,
            status: 'added',
            pullRequest: {
              id: 'pr_2',
              number: 235,
              title: 'Add authentication endpoints'
            }
          }
        ];

        const demoPipelines = [
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
          }
        ];

        const demoDeployments = [
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
          }
        ];

        const demoLogs = [
          {
            id: 'log_1',
            timestamp: '2024-01-15 10:30:45',
            level: 'info',
            message: 'User authentication successful',
            source: 'auth-service',
            service: 'mobile-api-backend',
            environment: 'production',
            metadata: {
              userId: 'user_123',
              requestId: 'req_456',
              ip: '192.168.1.100'
            }
          },
          {
            id: 'log_2',
            timestamp: '2024-01-15 10:29:12',
            level: 'error',
            message: 'Database connection failed',
            source: 'database',
            service: 'analytics-dashboard',
            environment: 'production',
            details: 'Connection timeout after 30 seconds. Retrying...',
            metadata: {
              requestId: 'req_789'
            }
          }
        ];

        const demoErrors = [
          {
            id: 'error_1',
            timestamp: '2024-01-15 10:30:45',
            level: 'critical',
            message: 'Database connection pool exhausted',
            stackTrace: 'Error: Connection pool exhausted\n    at Database.connect (db.js:45)',
            source: 'database',
            service: 'mobile-api-backend',
            environment: 'production',
            occurrences: 15,
            firstSeen: '2 hours ago',
            lastSeen: '5 minutes ago',
            status: 'investigating',
            assignedTo: 'John Developer',
            metadata: {
              requestId: 'req_456',
              ip: '192.168.1.100'
            }
          },
          {
            id: 'error_2',
            timestamp: '2024-01-15 10:29:12',
            level: 'error',
            message: 'Payment processing failed',
            stackTrace: 'Error: Payment gateway timeout\n    at PaymentService.process (payment.js:78)',
            source: 'payment-service',
            service: 'ecommerce-frontend',
            environment: 'production',
            occurrences: 8,
            firstSeen: '4 hours ago',
            lastSeen: '1 hour ago',
            status: 'open',
            metadata: {
              userId: 'user_123',
              requestId: 'req_789'
            }
          }
        ];

        setState({
          user: demoUser,
          projects: demoProjects,
          repositories: demoRepositories,
          commits: demoCommits,
          pipelines: demoPipelines,
          deployments: demoDeployments,
          logs: demoLogs,
          errors: demoErrors,
          loading: false,
          error: null
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load developer data'
        }));
      }
    };

    initializeData();
  }, []);

  // Action handlers
  const createProject = useCallback(async (projectData: any) => {
    // Simulate project creation
    const newProject = {
      id: `proj_${Date.now()}`,
      ...projectData,
      status: 'active',
      lastCommit: 'Just now',
      commits: 0,
      branches: 1,
      pipelineStatus: 'pending',
      deployments: 0
    };

    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));

    return newProject;
  }, []);

  const runPipeline = useCallback(async (pipelineId: string) => {
    setState(prev => ({
      ...prev,
      pipelines: prev.pipelines.map(pipeline =>
        pipeline.id === pipelineId
          ? { ...pipeline, status: 'running', startedAt: new Date().toISOString() }
          : pipeline
      )
    }));

    // Simulate pipeline completion
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        pipelines: prev.pipelines.map(pipeline =>
          pipeline.id === pipelineId
            ? { 
                ...pipeline, 
                status: Math.random() > 0.2 ? 'success' : 'failed',
                completedAt: new Date().toISOString(),
                duration: Math.floor(Math.random() * 300) + 60
              }
            : pipeline
        )
      }));
    }, 3000);
  }, []);

  const deployApplication = useCallback(async (deploymentData: any) => {
    const newDeployment = {
      id: `deploy_${Date.now()}`,
      ...deploymentData,
      status: 'deploying',
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      duration: 0
    };

    setState(prev => ({
      ...prev,
      deployments: [...prev.deployments, newDeployment]
    }));

    // Simulate deployment completion
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        deployments: prev.deployments.map(deployment =>
          deployment.id === newDeployment.id
            ? { 
                ...deployment, 
                status: Math.random() > 0.1 ? 'deployed' : 'failed',
                completedAt: new Date().toISOString(),
                duration: Math.floor(Math.random() * 200) + 60,
                healthCheck: Math.random() > 0.1 ? 'passing' : 'failing'
              }
            : deployment
        )
      }));
    }, 5000);
  }, []);

  const addCommit = useCallback(async (commitData: any) => {
    const newCommit = {
      id: `commit_${Date.now()}`,
      hash: Math.random().toString(36).substring(2, 9),
      ...commitData,
      timestamp: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      commits: [newCommit, ...prev.commits]
    }));

    return newCommit;
  }, []);

  const resolveError = useCallback(async (errorId: string) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.map(error =>
        error.id === errorId
          ? { ...error, status: 'resolved' }
          : error
      )
    }));
  }, []);

  return {
    ...state,
    actions: {
      createProject,
      runPipeline,
      deployApplication,
      addCommit,
      resolveError
    }
  };
};

export default useDeveloperState;
