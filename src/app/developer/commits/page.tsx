// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  GitCommit, 
  GitBranch, 
  User, 
  Clock, 
  FileText,
  MoreHorizontal,
  Code,
  GitMerge,
  GitPullRequest,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  repository: string;
  branch: string;
  additions: number;
  deletions: number;
  files: number;
  status: 'added' | 'modified' | 'deleted';
  pullRequest?: {
    id: string;
    number: number;
    title: string;
  };
}

const DeveloperCommitsPage: React.FC = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoCommits: Commit[] = [
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
      },
      {
        id: 'commit_3',
        hash: 'b5c1d4e',
        message: 'Update ML model for better predictions accuracy',
        author: {
          name: 'Jane Smith',
          email: 'jane@company.com'
        },
        timestamp: '1 day ago',
        repository: 'analytics-dashboard',
        branch: 'main',
        additions: 89,
        deletions: 34,
        files: 5,
        status: 'modified'
      },
      {
        id: 'commit_4',
        hash: 'c9e8f7a',
        message: 'Remove deprecated API endpoints',
        author: {
          name: 'DevOps Team',
          email: 'devops@company.com'
        },
        timestamp: '3 days ago',
        repository: 'devops-automation',
        branch: 'main',
        additions: 0,
        deletions: 156,
        files: 8,
        status: 'deleted'
      },
      {
        id: 'commit_5',
        hash: 'd2e5f8b',
        message: 'Add responsive design for mobile devices',
        author: {
          name: 'Sarah Johnson',
          email: 'sarah@company.com'
        },
        timestamp: '4 days ago',
        repository: 'ecommerce-frontend',
        branch: 'develop',
        additions: 234,
        deletions: 67,
        files: 12,
        status: 'added'
      }
    ];

    setTimeout(() => {
      setCommits(demoCommits);
      setLoading(false);
    }, 800);
  }, []);

  const filteredCommits = commits.filter(commit => {
    const matchesSearch = commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commit.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commit.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commit.hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || commit.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'added': 'bg-green-100 text-green-800',
      'modified': 'bg-blue-100 text-blue-800',
      'deleted': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading commits...</p>
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
            <h1 className="text-3xl font-bold">Commits</h1>
            <p className="text-muted-foreground">Track code changes across all repositories</p>
          </div>
          <Button>
            <GitCommit className="h-4 w-4 mr-2" />
            Compare Branches
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            Branch: {selectedBranch}
          </Button>
        </div>

        {/* Commits List */}
        <div className="space-y-4">
          {filteredCommits.map((commit) => (
            <Card key={commit.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <GitCommit className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="outline" className="font-mono text-xs">
                        {commit.hash}
                      </Badge>
                      <Badge className={getStatusColor(commit.status)}>
                        {commit.status}
                      </Badge>
                      {commit.pullRequest && (
                        <Badge variant="secondary">
                          <GitPullRequest className="h-3 w-3 mr-1" />
                          #{commit.pullRequest.number}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">{commit.message}</h3>
                    
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{commit.author.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-4 w-4" />
                        <span>{commit.branch}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{commit.repository}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{commit.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600">
                          +{commit.additions} additions
                        </span>
                        <span className="text-red-600">
                          -{commit.deletions} deletions
                        </span>
                        <span className="text-muted-foreground">
                          {commit.files} files changed
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {commit.pullRequest && (
                          <Button variant="outline" size="sm">
                            <GitPullRequest className="h-4 w-4 mr-2" />
                            View PR
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Code className="h-4 w-4 mr-2" />
                          View Code
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCommits.length === 0 && (
          <div className="text-center py-12">
            <GitCommit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No commits found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No commits have been made yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperCommitsPage;
