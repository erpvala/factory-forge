// @ts-nocheck
'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Types for our state
interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  lastCommit: string;
  commits: number;
  branches: number;
  pipelineStatus: string;
  deployments: number;
  createdAt: string;
  updatedAt: string;
}

interface Repository {
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
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: string;
  repositoryId: string;
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
}

interface Pipeline {
  id: string;
  name: string;
  status: string;
  projectId: string;
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
}

interface Deployment {
  id: string;
  version: string;
  status: string;
  environment: string;
  projectId: string;
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
}

interface LogEntry {
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
}

interface ErrorEntry {
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
}

interface DeveloperState {
  // Data
  projects: Project[];
  repositories: Repository[];
  commits: Commit[];
  pipelines: Pipeline[];
  deployments: Deployment[];
  logs: LogEntry[];
  errors: ErrorEntry[];
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedProject: string | null;
  selectedRepository: string | null;
  
  // Filters
  projectFilter: string;
  repositoryFilter: string;
  commitFilter: string;
  pipelineFilter: string;
  deploymentFilter: string;
  logFilter: string;
  errorFilter: string;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  setRepositories: (repositories: Repository[]) => void;
  addRepository: (repository: Repository) => void;
  updateRepository: (id: string, updates: Partial<Repository>) => void;
  deleteRepository: (id: string) => void;
  
  setCommits: (commits: Commit[]) => void;
  addCommit: (commit: Commit) => void;
  updateCommit: (id: string, updates: Partial<Commit>) => void;
  
  setPipelines: (pipelines: Pipeline[]) => void;
  addPipeline: (pipeline: Pipeline) => void;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  
  setDeployments: (deployments: Deployment[]) => void;
  addDeployment: (deployment: Deployment) => void;
  updateDeployment: (id: string, updates: Partial<Deployment>) => void;
  
  setLogs: (logs: LogEntry[]) => void;
  addLog: (log: LogEntry) => void;
  
  setErrors: (errors: ErrorEntry[]) => void;
  addError: (error: ErrorEntry) => void;
  updateError: (id: string, updates: Partial<ErrorEntry>) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProject: (projectId: string | null) => void;
  setSelectedRepository: (repositoryId: string | null) => void;
  
  // Filter Actions
  setProjectFilter: (filter: string) => void;
  setRepositoryFilter: (filter: string) => void;
  setCommitFilter: (filter: string) => void;
  setPipelineFilter: (filter: string) => void;
  setDeploymentFilter: (filter: string) => void;
  setLogFilter: (filter: string) => void;
  setErrorFilter: (filter: string) => void;
  
  // Computed selectors
  getProjectById: (id: string) => Project | undefined;
  getRepositoryById: (id: string) => Repository | undefined;
  getCommitsByRepository: (repositoryId: string) => Commit[];
  getPipelinesByProject: (projectId: string) => Pipeline[];
  getDeploymentsByProject: (projectId: string) => Deployment[];
  getLogsByService: (service: string) => LogEntry[];
  getErrorsByStatus: (status: string) => ErrorEntry[];
  
  // Clear all data
  clearAllData: () => void;
}

const useDeveloperStore = create<DeveloperState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      projects: [],
      repositories: [],
      commits: [],
      pipelines: [],
      deployments: [],
      logs: [],
      errors: [],
      
      loading: false,
      error: null,
      selectedProject: null,
      selectedRepository: null,
      
      projectFilter: '',
      repositoryFilter: '',
      commitFilter: '',
      pipelineFilter: '',
      deploymentFilter: '',
      logFilter: '',
      errorFilter: '',
      
      // Project Actions
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, updatedAt: new Date().toISOString() }]
      })),
      
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(project =>
          project.id === id 
            ? { ...project, ...updates, updatedAt: new Date().toISOString() }
            : project
        )
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(project => project.id !== id),
        // Also delete related repositories, commits, pipelines, deployments
        repositories: state.repositories.filter(repo => repo.projectId !== id),
        commits: state.commits.filter(commit => {
          const repo = state.repositories.find(r => r.id === commit.repositoryId);
          return repo?.projectId !== id;
        }),
        pipelines: state.pipelines.filter(pipeline => pipeline.projectId !== id),
        deployments: state.deployments.filter(deployment => deployment.projectId !== id)
      })),
      
      // Repository Actions
      setRepositories: (repositories) => set({ repositories }),
      
      addRepository: (repository) => set((state) => ({
        repositories: [...state.repositories, { ...repository, updatedAt: new Date().toISOString() }]
      })),
      
      updateRepository: (id, updates) => set((state) => ({
        repositories: state.repositories.map(repository =>
          repository.id === id 
            ? { ...repository, ...updates, updatedAt: new Date().toISOString() }
            : repository
        )
      })),
      
      deleteRepository: (id) => set((state) => ({
        repositories: state.repositories.filter(repository => repository.id !== id),
        // Also delete related commits
        commits: state.commits.filter(commit => commit.repositoryId !== id)
      })),
      
      // Commit Actions
      setCommits: (commits) => set({ commits }),
      
      addCommit: (commit) => set((state) => ({
        commits: [commit, ...state.commits]
      })),
      
      updateCommit: (id, updates) => set((state) => ({
        commits: state.commits.map(commit =>
          commit.id === id ? { ...commit, ...updates } : commit
        )
      })),
      
      // Pipeline Actions
      setPipelines: (pipelines) => set({ pipelines }),
      
      addPipeline: (pipeline) => set((state) => ({
        pipelines: [pipeline, ...state.pipelines]
      })),
      
      updatePipeline: (id, updates) => set((state) => ({
        pipelines: state.pipelines.map(pipeline =>
          pipeline.id === id ? { ...pipeline, ...updates } : pipeline
        )
      })),
      
      // Deployment Actions
      setDeployments: (deployments) => set({ deployments }),
      
      addDeployment: (deployment) => set((state) => ({
        deployments: [deployment, ...state.deployments]
      })),
      
      updateDeployment: (id, updates) => set((state) => ({
        deployments: state.deployments.map(deployment =>
          deployment.id === id ? { ...deployment, ...updates } : deployment
        )
      })),
      
      // Log Actions
      setLogs: (logs) => set({ logs }),
      
      addLog: (log) => set((state) => ({
        logs: [log, ...state.logs]
      })),
      
      // Error Actions
      setErrors: (errors) => set({ errors }),
      
      addError: (error) => set((state) => ({
        errors: [error, ...state.errors]
      })),
      
      updateError: (id, updates) => set((state) => ({
        errors: state.errors.map(error =>
          error.id === id ? { ...error, ...updates } : error
        )
      })),
      
      // UI Actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedProject: (selectedProject) => set({ selectedProject }),
      setSelectedRepository: (selectedRepository) => set({ selectedRepository }),
      
      // Filter Actions
      setProjectFilter: (projectFilter) => set({ projectFilter }),
      setRepositoryFilter: (repositoryFilter) => set({ repositoryFilter }),
      setCommitFilter: (commitFilter) => set({ commitFilter }),
      setPipelineFilter: (pipelineFilter) => set({ pipelineFilter }),
      setDeploymentFilter: (deploymentFilter) => set({ deploymentFilter }),
      setLogFilter: (logFilter) => set({ logFilter }),
      setErrorFilter: (errorFilter) => set({ errorFilter }),
      
      // Computed Selectors
      getProjectById: (id) => get().projects.find(project => project.id === id),
      
      getRepositoryById: (id) => get().repositories.find(repository => repository.id === id),
      
      getCommitsByRepository: (repositoryId) => 
        get().commits.filter(commit => commit.repositoryId === repositoryId),
      
      getPipelinesByProject: (projectId) => 
        get().pipelines.filter(pipeline => pipeline.projectId === projectId),
      
      getDeploymentsByProject: (projectId) => 
        get().deployments.filter(deployment => deployment.projectId === projectId),
      
      getLogsByService: (service) => 
        get().logs.filter(log => log.service === service),
      
      getErrorsByStatus: (status) => 
        get().errors.filter(error => error.status === status),
      
      // Clear all data
      clearAllData: () => set({
        projects: [],
        repositories: [],
        commits: [],
        pipelines: [],
        deployments: [],
        logs: [],
        errors: [],
        selectedProject: null,
        selectedRepository: null,
        projectFilter: '',
        repositoryFilter: '',
        commitFilter: '',
        pipelineFilter: '',
        deploymentFilter: '',
        logFilter: '',
        errorFilter: '',
        error: null
      })
    })),
    {
      name: 'developer-store',
    }
  )
);

export default useDeveloperStore;
