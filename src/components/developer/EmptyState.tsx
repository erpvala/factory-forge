// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FolderOpen, 
  GitBranch, 
  GitCommit, 
  Activity, 
  Cloud, 
  FileText, 
  AlertTriangle, 
  Code, 
  Settings,
  Plus,
  Search
} from 'lucide-react';

interface EmptyStateProps {
  type: 'projects' | 'repositories' | 'commits' | 'pipelines' | 'deployments' | 'logs' | 'errors' | 'api' | 'settings';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateConfig = {
  projects: {
    icon: FolderOpen,
    defaultTitle: 'No Projects Found',
    defaultDescription: 'Create your first project to get started with development.',
    defaultAction: 'Create Project'
  },
  repositories: {
    icon: GitBranch,
    defaultTitle: 'No Repositories',
    defaultDescription: 'Repositories will appear here when you create projects.',
    defaultAction: 'Create Repository'
  },
  commits: {
    icon: GitCommit,
    defaultTitle: 'No Commits',
    defaultDescription: 'Start making commits to see your code history here.',
    defaultAction: 'Make First Commit'
  },
  pipelines: {
    icon: Activity,
    defaultTitle: 'No Pipelines',
    defaultDescription: 'Set up CI/CD pipelines to automate your build and deployment process.',
    defaultAction: 'Create Pipeline'
  },
  deployments: {
    icon: Cloud,
    defaultTitle: 'No Deployments',
    defaultDescription: 'Deploy your applications to see deployment history and status.',
    defaultAction: 'Deploy Application'
  },
  logs: {
    icon: FileText,
    defaultTitle: 'No Logs Available',
    defaultDescription: 'Application logs will appear here once your applications are running.',
    defaultAction: 'View System Logs'
  },
  errors: {
    icon: AlertTriangle,
    defaultTitle: 'No Errors',
    defaultDescription: 'Great! No errors detected in your applications.',
    defaultAction: 'Check System Health'
  },
  api: {
    icon: Code,
    defaultTitle: 'No API Endpoints',
    defaultDescription: 'API endpoints will be listed here once you create them.',
    defaultAction: 'Create API Endpoint'
  },
  settings: {
    icon: Settings,
    defaultTitle: 'Settings',
    defaultDescription: 'Configure your developer preferences and account settings.',
    defaultAction: 'Update Settings'
  }
};

const DeveloperEmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  title, 
  description, 
  action 
}) => {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  const handleDefaultAction = () => {
    // Default action handlers for each type
    switch (type) {
      case 'projects':
        console.log('Navigate to project creation');
        break;
      case 'repositories':
        console.log('Navigate to repository creation');
        break;
      case 'commits':
        console.log('Navigate to commit interface');
        break;
      case 'pipelines':
        console.log('Navigate to pipeline setup');
        break;
      case 'deployments':
        console.log('Navigate to deployment interface');
        break;
      case 'logs':
        console.log('Navigate to logs viewer');
        break;
      case 'errors':
        console.log('Navigate to error monitoring');
        break;
      case 'api':
        console.log('Navigate to API documentation');
        break;
      case 'settings':
        console.log('Navigate to settings page');
        break;
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {title || config.defaultTitle}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {description || config.defaultDescription}
        </p>
        
        <div className="flex items-center space-x-3">
          {action ? (
            <Button onClick={action.onClick}>
              <Plus className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ) : (
            <Button onClick={handleDefaultAction}>
              <Plus className="h-4 w-4 mr-2" />
              {config.defaultAction}
            </Button>
          )}
          
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeveloperEmptyState;
