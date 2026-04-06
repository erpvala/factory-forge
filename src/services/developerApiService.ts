// @ts-nocheck
'use client';

import { Project, Repository, Commit, Pipeline, Deployment, LogEntry, ErrorEntry } from '../store/developerStore';

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Types
enum ApiError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT'
}

// Mock delay function to simulate network latency
const delay = (ms: number = 300 + Math.random() * 700): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Simulate random API failures (5% failure rate)
const simulateApiFailure = (): boolean => {
  return Math.random() < 0.05;
};

// Generate API response
function createResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  };
}

// Mock data storage (in production, this would be a real database)
let mockProjects: Project[] = [];
let mockRepositories: Repository[] = [];
let mockCommits: Commit[] = [];
let mockPipelines: Pipeline[] = [];
let mockDeployments: Deployment[] = [];
let mockLogs: LogEntry[] = [];
let mockErrors: ErrorEntry[] = [];

// Initialize mock data
const initializeMockData = () => {
  // This would be populated from demo data in a real implementation
  // For now, we'll use empty arrays and let the components add data
};

// API Service Class
class DeveloperApiService {
  constructor() {
    initializeMockData();
  }

  // Generic API request handler
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      // Simulate network delay
      await delay();

      // Simulate random API failures
      if (simulateApiFailure()) {
        return createResponse(false, undefined, 'API_ERROR', 'Simulated API failure');
      }

      // Route to appropriate handler
      switch (endpoint) {
        case '/projects':
          return this.handleProjects(method, data);
        case '/repositories':
          return this.handleRepositories(method, data);
        case '/commits':
          return this.handleCommits(method, data);
        case '/pipelines':
          return this.handlePipelines(method, data);
        case '/deployments':
          return this.handleDeployments(method, data);
        case '/logs':
          return this.handleLogs(method, data);
        case '/errors':
          return this.handleErrors(method, data);
        default:
          return createResponse(false, undefined, 'NOT_FOUND', 'Endpoint not found');
      }
    } catch (error) {
      return createResponse(false, undefined, 'SERVER_ERROR', 'Internal server error');
    }
  }

  // Projects API
  private async handleProjects(method: string, data?: any): Promise<ApiResponse<Project[] | Project>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockProjects);
      case 'POST':
        if (!data?.name) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Project name is required');
        }
        const newProject: Project = {
          id: `project_${Date.now()}`,
          name: data.name,
          description: data.description || '',
          status: 'active',
          lastCommit: 'No commits yet',
          commits: 0,
          branches: 1,
          pipelineStatus: 'pending',
          deployments: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockProjects.push(newProject);
        return createResponse(true, newProject, undefined, 'Project created successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Repositories API
  private async handleRepositories(method: string, data?: any): Promise<ApiResponse<Repository[] | Repository>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockRepositories);
      case 'POST':
        if (!data?.name || !data?.projectId) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Repository name and project ID are required');
        }
        const newRepository: Repository = {
          id: `repo_${Date.now()}`,
          name: data.name,
          description: data.description || '',
          language: data.language || 'JavaScript',
          stars: 0,
          forks: 0,
          watchers: 0,
          openIssues: 0,
          defaultBranch: 'main',
          lastCommit: {
            message: 'Initial commit',
            author: 'System',
            timestamp: new Date().toISOString(),
            hash: 'abc123'
          },
          visibility: data.visibility || 'private',
          projectId: data.projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockRepositories.push(newRepository);
        return createResponse(true, newRepository, undefined, 'Repository created successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Commits API
  private async handleCommits(method: string, data?: any): Promise<ApiResponse<Commit[] | Commit>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockCommits);
      case 'POST':
        if (!data?.message || !data?.repositoryId || !data?.author) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Commit message, repository ID, and author are required');
        }
        const newCommit: Commit = {
          id: `commit_${Date.now()}`,
          hash: `${Math.random().toString(36).substr(2, 8)}`,
          message: data.message,
          author: {
            name: data.author.name,
            email: data.author.email
          },
          timestamp: new Date().toISOString(),
          repositoryId: data.repositoryId,
          branch: data.branch || 'main',
          additions: data.additions || 0,
          deletions: data.deletions || 0,
          files: data.files || 1,
          status: 'added'
        };
        mockCommits.unshift(newCommit);
        return createResponse(true, newCommit, undefined, 'Commit created successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Pipelines API
  private async handlePipelines(method: string, data?: any): Promise<ApiResponse<Pipeline[] | Pipeline>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockPipelines);
      case 'POST':
        if (!data?.projectId || !data?.commit) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Project ID and commit are required');
        }
        const newPipeline: Pipeline = {
          id: `pipeline_${Date.now()}`,
          name: data.name || 'Build and Deploy',
          status: 'pending',
          projectId: data.projectId,
          branch: data.branch || 'main',
          commit: data.commit,
          stages: [
            { name: 'Build', status: 'pending' },
            { name: 'Test', status: 'pending' },
            { name: 'Deploy', status: 'pending' }
          ],
          duration: 0,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          triggeredBy: data.triggeredBy || 'System'
        };
        mockPipelines.unshift(newPipeline);
        
        // Simulate pipeline execution
        this.simulatePipelineExecution(newPipeline.id);
        
        return createResponse(true, newPipeline, undefined, 'Pipeline triggered successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Deployments API
  private async handleDeployments(method: string, data?: any): Promise<ApiResponse<Deployment[] | Deployment>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockDeployments);
      case 'POST':
        if (!data?.projectId || !data?.environment) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Project ID and environment are required');
        }
        const newDeployment: Deployment = {
          id: `deployment_${Date.now()}`,
          version: data.version || `v${Date.now()}`,
          status: 'pending',
          environment: data.environment,
          projectId: data.projectId,
          branch: data.branch || 'main',
          commit: data.commit || { hash: 'abc123', message: 'Latest commit', author: 'System' },
          server: data.server || 'prod-server-01',
          url: data.url,
          duration: 0,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          deployedBy: data.deployedBy || 'System',
          healthCheck: 'pending'
        };
        mockDeployments.unshift(newDeployment);
        
        // Simulate deployment process
        this.simulateDeploymentProcess(newDeployment.id);
        
        return createResponse(true, newDeployment, undefined, 'Deployment started successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Logs API
  private async handleLogs(method: string, data?: any): Promise<ApiResponse<LogEntry[] | LogEntry>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockLogs);
      case 'POST':
        if (!data?.message || !data?.level || !data?.source) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Message, level, and source are required');
        }
        const newLog: LogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: data.level,
          message: data.message,
          source: data.source,
          service: data.service || 'unknown',
          environment: data.environment || 'production',
          metadata: data.metadata
        };
        mockLogs.unshift(newLog);
        return createResponse(true, newLog, undefined, 'Log entry created successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Errors API
  private async handleErrors(method: string, data?: any): Promise<ApiResponse<ErrorEntry[] | ErrorEntry>> {
    switch (method) {
      case 'GET':
        return createResponse(true, mockErrors);
      case 'POST':
        if (!data?.message || !data?.level || !data?.source) {
          return createResponse(false, undefined, 'VALIDATION_ERROR', 'Message, level, and source are required');
        }
        const newError: ErrorEntry = {
          id: `error_${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: data.level,
          message: data.message,
          stackTrace: data.stackTrace,
          source: data.source,
          service: data.service || 'unknown',
          environment: data.environment || 'production',
          occurrences: 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'open',
          metadata: data.metadata
        };
        mockErrors.unshift(newError);
        return createResponse(true, newError, undefined, 'Error logged successfully');
      default:
        return createResponse(false, undefined, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }
  }

  // Simulate pipeline execution
  private async simulatePipelineExecution(pipelineId: string): Promise<void> {
    const pipeline = mockPipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;

    // Update stages sequentially
    const stages = ['Build', 'Test', 'Deploy'];
    for (let i = 0; i < stages.length; i++) {
      await delay(2000 + Math.random() * 3000); // 2-5 seconds per stage
      
      const stageIndex = pipeline.stages.findIndex(s => s.name === stages[i]);
      if (stageIndex !== -1) {
        pipeline.stages[stageIndex].status = Math.random() > 0.1 ? 'success' : 'failed';
        pipeline.stages[stageIndex].duration = 2000 + Math.random() * 3000;
      }

      // If a stage fails, stop the pipeline
      if (pipeline.stages[stageIndex]?.status === 'failed') {
        pipeline.status = 'failed';
        pipeline.completedAt = new Date().toISOString();
        return;
      }
    }

    // Pipeline completed successfully
    pipeline.status = 'success';
    pipeline.completedAt = new Date().toISOString();
    pipeline.duration = Date.now() - new Date(pipeline.startedAt!).getTime();
  }

  // Simulate deployment process
  private async simulateDeploymentProcess(deploymentId: string): Promise<void> {
    const deployment = mockDeployments.find(d => d.id === deploymentId);
    if (!deployment) return;

    await delay(5000 + Math.random() * 10000); // 5-15 seconds deployment time

    deployment.status = Math.random() > 0.1 ? 'deployed' : 'failed';
    deployment.completedAt = new Date().toISOString();
    deployment.duration = Date.now() - new Date(deployment.startedAt!).getTime();
    deployment.healthCheck = deployment.status === 'deployed' ? 'passing' : 'failing';

    if (deployment.status === 'deployed') {
      deployment.metrics = {
        cpu: 20 + Math.random() * 60,
        memory: 30 + Math.random() * 50,
        requests: Math.floor(Math.random() * 2000),
        errors: Math.floor(Math.random() * 10)
      };
    }
  }

  // Public API Methods
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.makeRequest('/projects', 'GET');
  }

  async createProject(projectData: any): Promise<ApiResponse<Project>> {
    return this.makeRequest('/projects', 'POST', projectData);
  }

  async getRepositories(): Promise<ApiResponse<Repository[]>> {
    return this.makeRequest('/repositories', 'GET');
  }

  async createRepository(repoData: any): Promise<ApiResponse<Repository>> {
    return this.makeRequest('/repositories', 'POST', repoData);
  }

  async getCommits(): Promise<ApiResponse<Commit[]>> {
    return this.makeRequest('/commits', 'GET');
  }

  async createCommit(commitData: any): Promise<ApiResponse<Commit>> {
    return this.makeRequest('/commits', 'POST', commitData);
  }

  async getPipelines(): Promise<ApiResponse<Pipeline[]>> {
    return this.makeRequest('/pipelines', 'GET');
  }

  async triggerPipeline(pipelineData: any): Promise<ApiResponse<Pipeline>> {
    return this.makeRequest('/pipelines', 'POST', pipelineData);
  }

  async getDeployments(): Promise<ApiResponse<Deployment[]>> {
    return this.makeRequest('/deployments', 'GET');
  }

  async createDeployment(deploymentData: any): Promise<ApiResponse<Deployment>> {
    return this.makeRequest('/deployments', 'POST', deploymentData);
  }

  async getLogs(): Promise<ApiResponse<LogEntry[]>> {
    return this.makeRequest('/logs', 'GET');
  }

  async createLog(logData: any): Promise<ApiResponse<LogEntry>> {
    return this.makeRequest('/logs', 'POST', logData);
  }

  async getErrors(): Promise<ApiResponse<ErrorEntry[]>> {
    return this.makeRequest('/errors', 'GET');
  }

  async createError(errorData: any): Promise<ApiResponse<ErrorEntry>> {
    return this.makeRequest('/errors', 'POST', errorData);
  }
}

// Export singleton instance
const developerApiService = new DeveloperApiService();
export default developerApiService;
