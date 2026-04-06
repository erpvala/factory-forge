// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  GitBranch, 
  GitCommit, 
  Users, 
  Clock, 
  FileText,
  MoreHorizontal,
  Code,
  GitMerge,
  GitPullRequest,
  Star,
  Eye
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  description: string;
  language: string;
  size: string;
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
  visibility: 'public' | 'private';
  createdAt: string;
}

const DeveloperRepositoriesPage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoRepositories: Repository[] = [
      {
        id: 'repo_1',
        name: 'ecommerce-frontend',
        description: 'React-based e-commerce frontend application',
        language: 'React',
        size: '245 MB',
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
        size: '128 MB',
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
      },
      {
        id: 'repo_3',
        name: 'analytics-dashboard',
        description: 'Python-based analytics platform with ML integration',
        language: 'Python',
        size: '512 MB',
        stars: 234,
        forks: 45,
        watchers: 32,
        openIssues: 8,
        defaultBranch: 'main',
        lastCommit: {
          message: 'Update ML model for better predictions',
          author: 'Jane Smith',
          timestamp: '1 day ago',
          hash: 'b5c1d4e'
        },
        visibility: 'public',
        createdAt: '1 year ago'
      },
      {
        id: 'repo_4',
        name: 'devops-automation',
        description: 'Terraform and Ansible scripts for infrastructure',
        language: 'Terraform',
        size: '89 MB',
        stars: 67,
        forks: 8,
        watchers: 5,
        openIssues: 0,
        defaultBranch: 'main',
        lastCommit: {
          message: 'Add production environment configuration',
          author: 'DevOps Team',
          timestamp: '3 days ago',
          hash: 'c9e8f7a'
        },
        visibility: 'private',
        createdAt: '2 years ago'
      }
    ];

    setTimeout(() => {
      setRepositories(demoRepositories);
      setLoading(false);
    }, 800);
  }, []);

  const filteredRepositories = repositories.filter(repo => {
    return repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           repo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           repo.language.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'React': 'bg-blue-100 text-blue-800',
      'Node.js': 'bg-green-100 text-green-800',
      'Python': 'bg-yellow-100 text-yellow-800',
      'Terraform': 'bg-purple-100 text-purple-800'
    };
    return colors[language] || 'bg-gray-100 text-gray-800';
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? '🌐' : '🔒';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading repositories...</p>
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
            <h1 className="text-3xl font-bold">Repositories</h1>
            <p className="text-muted-foreground">Browse and manage your code repositories</p>
          </div>
          <Button>
            <GitBranch className="h-4 w-4 mr-2" />
            New Repository
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Repositories List */}
        <div className="space-y-4">
          {filteredRepositories.map((repo) => (
            <Card key={repo.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <GitBranch className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{repo.name}</h3>
                      <span className="text-lg">{getVisibilityIcon(repo.visibility)}</span>
                      <Badge className={getLanguageColor(repo.language)}>
                        {repo.language}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{repo.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{repo.stars}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-4 w-4" />
                        <span>{repo.forks}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{repo.watchers}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{repo.openIssues} issues</span>
                      </div>
                      <span>{repo.size}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{repo.lastCommit.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {repo.lastCommit.author} committed {repo.lastCommit.timestamp}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {repo.lastCommit.hash}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Code className="h-4 w-4 mr-2" />
                          Code
                        </Button>
                        <Button variant="outline" size="sm">
                          <GitPullRequest className="h-4 w-4 mr-2" />
                          PRs
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="ml-4">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRepositories.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first repository to get started'}
            </p>
            {!searchTerm && (
              <Button>
                <GitBranch className="h-4 w-4 mr-2" />
                Create Repository
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperRepositoriesPage;
