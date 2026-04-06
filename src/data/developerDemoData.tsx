// @ts-nocheck
'use client';

import { Project, Repository, Commit, Pipeline, Deployment, LogEntry, ErrorEntry } from '../store/developerStore';

// Helper function to generate random IDs
const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to generate random timestamps
const generateTimestamp = (hoursAgo: number = 0): string => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

// Helper function to generate random numbers
const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Demo Projects
export const demoProjects: Project[] = [
  {
    id: generateId('project'),
    name: 'E-commerce Platform',
    description: 'React-based e-commerce solution with payment integration and inventory management',
    status: 'active',
    lastCommit: '2 hours ago',
    commits: 234,
    branches: 8,
    pipelineStatus: 'success',
    deployments: 12,
    createdAt: generateTimestamp(720), // 30 days ago
    updatedAt: generateTimestamp(2)
  },
  {
    id: generateId('project'),
    name: 'Mobile API Backend',
    description: 'Node.js REST API serving mobile applications with authentication and real-time features',
    status: 'active',
    lastCommit: '5 hours ago',
    commits: 156,
    branches: 5,
    pipelineStatus: 'running',
    deployments: 8,
    createdAt: generateTimestamp(1440), // 60 days ago
    updatedAt: generateTimestamp(5)
  },
  {
    id: generateId('project'),
    name: 'Data Analytics Dashboard',
    description: 'Python-based analytics platform with machine learning insights and data visualization',
    status: 'active',
    lastCommit: '1 day ago',
    commits: 89,
    branches: 3,
    pipelineStatus: 'failed',
    deployments: 5,
    createdAt: generateTimestamp(2160), // 90 days ago
    updatedAt: generateTimestamp(24)
  },
  {
    id: generateId('project'),
    name: 'Content Management System',
    description: 'Headless CMS with GraphQL API and multi-channel content delivery',
    status: 'inactive',
    lastCommit: '3 days ago',
    commits: 67,
    branches: 4,
    pipelineStatus: 'success',
    deployments: 3,
    createdAt: generateTimestamp(1080), // 45 days ago
    updatedAt: generateTimestamp(72)
  },
  {
    id: generateId('project'),
    name: 'Real-time Chat Application',
    description: 'WebSocket-based chat platform with end-to-end encryption and file sharing',
    status: 'active',
    lastCommit: '30 minutes ago',
    commits: 312,
    branches: 12,
    pipelineStatus: 'success',
    deployments: 18,
    createdAt: generateTimestamp(360), // 15 days ago
    updatedAt: generateTimestamp(0.5)
  }
];

// Demo Repositories
export const demoRepositories: Repository[] = [
  {
    id: generateId('repo'),
    name: 'ecommerce-frontend',
    description: 'React-based e-commerce frontend application with modern UI/UX',
    language: 'React',
    stars: 145,
    forks: 23,
    watchers: 18,
    openIssues: 3,
    defaultBranch: 'main',
    lastCommit: {
      message: 'Fix checkout page validation and improve error handling',
      author: 'John Developer',
      timestamp: generateTimestamp(2),
      hash: 'a3f4b8c'
    },
    visibility: 'public',
    projectId: demoProjects[0].id,
    createdAt: generateTimestamp(720),
    updatedAt: generateTimestamp(2)
  },
  {
    id: generateId('repo'),
    name: 'ecommerce-backend',
    description: 'Node.js backend API for e-commerce platform with payment processing',
    language: 'Node.js',
    stars: 89,
    forks: 12,
    watchers: 7,
    openIssues: 1,
    defaultBranch: 'main',
    lastCommit: {
      message: 'Add payment webhook handling and order status updates',
      author: 'Sarah Developer',
      timestamp: generateTimestamp(4),
      hash: 'f7d2e9a'
    },
    visibility: 'private',
    projectId: demoProjects[0].id,
    createdAt: generateTimestamp(720),
    updatedAt: generateTimestamp(4)
  },
  {
    id: generateId('repo'),
    name: 'mobile-api-service',
    description: 'RESTful API service for mobile applications with JWT authentication',
    language: 'Node.js',
    stars: 67,
    forks: 8,
    watchers: 5,
    openIssues: 2,
    defaultBranch: 'main',
    lastCommit: {
      message: 'Implement push notification service and device token management',
      author: 'Mike Developer',
      timestamp: generateTimestamp(5),
      hash: 'b8c5d3f'
    },
    visibility: 'private',
    projectId: demoProjects[1].id,
    createdAt: generateTimestamp(1440),
    updatedAt: generateTimestamp(5)
  },
  {
    id: generateId('repo'),
    name: 'analytics-engine',
    description: 'Python analytics engine with machine learning capabilities',
    language: 'Python',
    stars: 234,
    forks: 45,
    watchers: 28,
    openIssues: 5,
    defaultBranch: 'main',
    lastCommit: {
      message: 'Add predictive analytics model and data preprocessing pipeline',
      author: 'Lisa Developer',
      timestamp: generateTimestamp(24),
      hash: 'c9e4a7b'
    },
    visibility: 'public',
    projectId: demoProjects[2].id,
    createdAt: generateTimestamp(2160),
    updatedAt: generateTimestamp(24)
  },
  {
    id: generateId('repo'),
    name: 'chat-websocket-server',
    description: 'WebSocket server for real-time chat with message persistence',
    language: 'Node.js',
    stars: 178,
    forks: 34,
    watchers: 19,
    openIssues: 0,
    defaultBranch: 'main',
    lastCommit: {
      message: 'Optimize message delivery and add read receipts feature',
      author: 'Tom Developer',
      timestamp: generateTimestamp(0.5),
      hash: 'd5f8b2c'
    },
    visibility: 'public',
    projectId: demoProjects[4].id,
    createdAt: generateTimestamp(360),
    updatedAt: generateTimestamp(0.5)
  }
];

// Demo Commits
export const demoCommits: Commit[] = [
  {
    id: generateId('commit'),
    hash: 'a3f4b8c',
    message: 'Fix checkout page validation and improve error handling',
    author: {
      name: 'John Developer',
      email: 'john@company.com'
    },
    timestamp: generateTimestamp(2),
    repositoryId: demoRepositories[0].id,
    branch: 'main',
    additions: 45,
    deletions: 12,
    files: 3,
    status: 'modified',
    pullRequest: {
      id: generateId('pr'),
      number: 234,
      title: 'Fix checkout validation'
    }
  },
  {
    id: generateId('commit'),
    hash: 'f7d2e9a',
    message: 'Add payment webhook handling and order status updates',
    author: {
      name: 'Sarah Developer',
      email: 'sarah@company.com'
    },
    timestamp: generateTimestamp(4),
    repositoryId: demoRepositories[1].id,
    branch: 'feature/payment-webhooks',
    additions: 128,
    deletions: 8,
    files: 7,
    status: 'added',
    pullRequest: {
      id: generateId('pr'),
      number: 235,
      title: 'Add payment webhooks'
    }
  },
  {
    id: generateId('commit'),
    hash: 'b8c5d3f',
    message: 'Implement push notification service and device token management',
    author: {
      name: 'Mike Developer',
      email: 'mike@company.com'
    },
    timestamp: generateTimestamp(5),
    repositoryId: demoRepositories[2].id,
    branch: 'feature/notifications',
    additions: 89,
    deletions: 15,
    files: 5,
    status: 'added'
  },
  {
    id: generateId('commit'),
    hash: 'c9e4a7b',
    message: 'Add predictive analytics model and data preprocessing pipeline',
    author: {
      name: 'Lisa Developer',
      email: 'lisa@company.com'
    },
    timestamp: generateTimestamp(24),
    repositoryId: demoRepositories[3].id,
    branch: 'feature/ml-models',
    additions: 234,
    deletions: 45,
    files: 12,
    status: 'added'
  },
  {
    id: generateId('commit'),
    hash: 'd5f8b2c',
    message: 'Optimize message delivery and add read receipts feature',
    author: {
      name: 'Tom Developer',
      email: 'tom@company.com'
    },
    timestamp: generateTimestamp(0.5),
    repositoryId: demoRepositories[4].id,
    branch: 'main',
    additions: 67,
    deletions: 23,
    files: 4,
    status: 'modified'
  }
];

// Demo Pipelines
export const demoPipelines: Pipeline[] = [
  {
    id: generateId('pipeline'),
    name: 'Build and Deploy',
    status: 'running',
    projectId: demoProjects[0].id,
    branch: 'main',
    commit: {
      hash: 'a3f4b8c',
      message: 'Fix checkout page validation',
      author: 'John Developer'
    },
    stages: [
      { name: 'Build', status: 'success', duration: 120 },
      { name: 'Test', status: 'success', duration: 180 },
      { name: 'Security Scan', status: 'success', duration: 90 },
      { name: 'Deploy to Staging', status: 'running' }
    ],
    duration: 0,
    createdAt: generateTimestamp(0.17), // 10 minutes ago
    startedAt: generateTimestamp(0.13), // 8 minutes ago
    triggeredBy: 'John Developer'
  },
  {
    id: generateId('pipeline'),
    name: 'CI/CD Pipeline',
    status: 'success',
    projectId: demoProjects[1].id,
    branch: 'feature/notifications',
    commit: {
      hash: 'b8c5d3f',
      message: 'Implement push notification service',
      author: 'Mike Developer'
    },
    stages: [
      { name: 'Lint', status: 'success', duration: 45 },
      { name: 'Unit Tests', status: 'success', duration: 120 },
      { name: 'Integration Tests', status: 'success', duration: 180 },
      { name: 'Build', status: 'success', duration: 90 },
      { name: 'Deploy to Staging', status: 'success', duration: 150 }
    ],
    duration: 585,
    createdAt: generateTimestamp(2),
    startedAt: generateTimestamp(2),
    completedAt: generateTimestamp(1.75), // 1 hour 45 minutes ago
    triggeredBy: 'Push to feature/notifications'
  },
  {
    id: generateId('pipeline'),
    name: 'Analytics Pipeline',
    status: 'failed',
    projectId: demoProjects[2].id,
    branch: 'main',
    commit: {
      hash: 'c9e4a7b',
      message: 'Add predictive analytics model',
      author: 'Lisa Developer'
    },
    stages: [
      { name: 'Environment Setup', status: 'success', duration: 180 },
      { name: 'Data Validation', status: 'success', duration: 240 },
      { name: 'Model Training', status: 'failed', error: 'GPU memory insufficient' }
    ],
    duration: 420,
    createdAt: generateTimestamp(24),
    startedAt: generateTimestamp(24),
    completedAt: generateTimestamp(23.5),
    triggeredBy: 'Manual trigger'
  }
];

// Demo Deployments
export const demoDeployments: Deployment[] = [
  {
    id: generateId('deployment'),
    version: 'v2.3.1',
    status: 'deployed',
    environment: 'production',
    projectId: demoProjects[0].id,
    branch: 'main',
    commit: {
      hash: 'a3f4b8c',
      message: 'Fix checkout page validation',
      author: 'John Developer'
    },
    server: 'prod-server-01',
    url: 'https://ecommerce.company.com',
    duration: 245,
    createdAt: generateTimestamp(2),
    startedAt: generateTimestamp(2),
    completedAt: generateTimestamp(1.92), // 1 hour 55 minutes ago
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
    id: generateId('deployment'),
    version: 'v1.8.0-beta',
    status: 'deploying',
    environment: 'staging',
    projectId: demoProjects[1].id,
    branch: 'feature/notifications',
    commit: {
      hash: 'b8c5d3f',
      message: 'Implement push notification service',
      author: 'Mike Developer'
    },
    server: 'staging-server-02',
    url: 'https://api-staging.company.com',
    duration: 0,
    createdAt: generateTimestamp(0.5), // 30 minutes ago
    startedAt: generateTimestamp(0.42), // 25 minutes ago
    deployedBy: 'CI/CD Pipeline',
    healthCheck: 'pending'
  },
  {
    id: generateId('deployment'),
    version: 'v1.5.2',
    status: 'failed',
    environment: 'production',
    projectId: demoProjects[2].id,
    branch: 'main',
    commit: {
      hash: 'c9e4a7b',
      message: 'Add predictive analytics model',
      author: 'Lisa Developer'
    },
    server: 'prod-server-03',
    duration: 180,
    createdAt: generateTimestamp(24),
    startedAt: generateTimestamp(24),
    completedAt: generateTimestamp(23.5),
    deployedBy: 'Lisa Developer',
    healthCheck: 'failing',
    metrics: {
      cpu: 89,
      memory: 95,
      requests: 2100,
      errors: 45
    }
  }
];

// Demo Logs
export const demoLogs: LogEntry[] = [
  {
    id: generateId('log'),
    timestamp: generateTimestamp(0.1),
    level: 'info',
    message: 'User authentication successful for user_123',
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
    id: generateId('log'),
    timestamp: generateTimestamp(0.2),
    level: 'error',
    message: 'Database connection failed - Connection timeout after 30 seconds',
    source: 'database',
    service: 'analytics-dashboard',
    environment: 'production',
    details: 'Connection pool exhausted. Retrying with exponential backoff...',
    metadata: {
      requestId: 'req_789'
    }
  },
  {
    id: generateId('log'),
    timestamp: generateTimestamp(0.3),
    level: 'warn',
    message: 'High memory usage detected - 85% memory utilization',
    source: 'system-monitor',
    service: 'ecommerce-frontend',
    environment: 'production',
    metadata: {
      server: 'prod-server-01',
      memoryUsage: '85%'
    }
  },
  {
    id: generateId('log'),
    timestamp: generateTimestamp(0.4),
    level: 'info',
    message: 'Pipeline completed successfully - Build and Deploy',
    source: 'ci-cd',
    service: 'jenkins',
    environment: 'production',
    metadata: {
      pipelineId: 'pipeline_1',
      duration: '245s',
      status: 'success'
    }
  },
  {
    id: generateId('log'),
    timestamp: generateTimestamp(0.5),
    level: 'debug',
    message: 'WebSocket connection established for chat session',
    source: 'websocket-server',
    service: 'chat-application',
    environment: 'production',
    metadata: {
      sessionId: 'session_abc123',
      userId: 'user_456'
    }
  }
];

// Demo Errors
export const demoErrors: ErrorEntry[] = [
  {
    id: generateId('error'),
    timestamp: generateTimestamp(0.2),
    level: 'critical',
    message: 'Database connection pool exhausted',
    stackTrace: 'Error: Connection pool exhausted\n    at Database.connect (db.js:45)\n    at UserService.authenticate (auth.js:23)\n    at async login (auth.js:89)',
    source: 'database',
    service: 'mobile-api-backend',
    environment: 'production',
    occurrences: 15,
    firstSeen: generateTimestamp(2),
    lastSeen: generateTimestamp(0.1),
    status: 'investigating',
    assignedTo: 'John Developer',
    metadata: {
      requestId: 'req_456',
      ip: '192.168.1.100'
    }
  },
  {
    id: generateId('error'),
    timestamp: generateTimestamp(1),
    level: 'error',
    message: 'Payment processing failed - Gateway timeout',
    stackTrace: 'Error: Payment gateway timeout\n    at PaymentService.process (payment.js:78)\n    at CheckoutController.createOrder (checkout.js:145)',
    source: 'payment-service',
    service: 'ecommerce-frontend',
    environment: 'production',
    occurrences: 8,
    firstSeen: generateTimestamp(4),
    lastSeen: generateTimestamp(1),
    status: 'open',
    metadata: {
      userId: 'user_123',
      requestId: 'req_789',
      amount: '$299.99'
    }
  },
  {
    id: generateId('error'),
    timestamp: generateTimestamp(24),
    level: 'error',
    message: 'GPU memory insufficient for model training',
    stackTrace: 'Error: CUDA out of memory\n    at train_model (ml_pipeline.py:234)\n    at AnalyticsEngine.process (analytics.py:89)',
    source: 'ml-engine',
    service: 'analytics-dashboard',
    environment: 'production',
    occurrences: 3,
    firstSeen: generateTimestamp(24),
    lastSeen: generateTimestamp(23.5),
    status: 'resolved',
    assignedTo: 'Lisa Developer'
  }
];

// Export all demo data
export const demoData = {
  projects: demoProjects,
  repositories: demoRepositories,
  commits: demoCommits,
  pipelines: demoPipelines,
  deployments: demoDeployments,
  logs: demoLogs,
  errors: demoErrors
};

// Helper function to initialize demo data with realistic relationships
export const initializeDemoData = () => {
  // Ensure all repositories have valid project references
  demoRepositories.forEach((repo, index) => {
    if (index < demoProjects.length) {
      repo.projectId = demoProjects[index].id;
    }
  });

  // Ensure all commits have valid repository references
  demoCommits.forEach((commit, index) => {
    if (index < demoRepositories.length) {
      commit.repositoryId = demoRepositories[index].id;
    }
  });

  // Ensure all pipelines have valid project references
  demoPipelines.forEach((pipeline, index) => {
    if (index < demoProjects.length) {
      pipeline.projectId = demoProjects[index].id;
    }
  });

  // Ensure all deployments have valid project references
  demoDeployments.forEach((deployment, index) => {
    if (index < demoProjects.length) {
      deployment.projectId = demoProjects[index].id;
    }
  });

  return demoData;
};

export default demoData;
