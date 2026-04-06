// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  GitBranch, 
  Users, 
  Clock, 
  Star,
  MoreHorizontal,
  Code,
  FolderOpen
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastCommit: string;
  status: 'active' | 'archived' | 'inactive';
  visibility: 'public' | 'private';
  owner: string;
  createdAt: string;
}

const DeveloperProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoProjects: Project[] = [
      {
        id: 'proj_1',
        name: 'E-commerce Platform',
        description: 'React-based e-commerce solution with payment integration',
        language: 'React',
        stars: 145,
        forks: 23,
        lastCommit: '2 hours ago',
        status: 'active',
        visibility: 'public',
        owner: 'john@company.com',
        createdAt: '3 months ago'
      },
      {
        id: 'proj_2',
        name: 'Mobile API Backend',
        description: 'Node.js REST API for mobile applications',
        language: 'Node.js',
        stars: 89,
        forks: 12,
        lastCommit: '5 hours ago',
        status: 'active',
        visibility: 'private',
        owner: 'john@company.com',
        createdAt: '6 months ago'
      },
      {
        id: 'proj_3',
        name: 'Data Analytics Dashboard',
        description: 'Python-based analytics platform with ML integration',
        language: 'Python',
        stars: 234,
        forks: 45,
        lastCommit: '1 day ago',
        status: 'active',
        visibility: 'public',
        owner: 'john@company.com',
        createdAt: '1 year ago'
      },
      {
        id: 'proj_4',
        name: 'DevOps Automation Scripts',
        description: 'Terraform and Ansible scripts for infrastructure',
        language: 'Terraform',
        stars: 67,
        forks: 8,
        lastCommit: '3 days ago',
        status: 'archived',
        visibility: 'private',
        owner: 'john@company.com',
        createdAt: '2 years ago'
      },
      {
        id: 'proj_5',
        name: 'Mobile App UI Components',
        description: 'Reusable React Native components library',
        language: 'React Native',
        stars: 178,
        forks: 34,
        lastCommit: '1 week ago',
        status: 'active',
        visibility: 'public',
        owner: 'john@company.com',
        createdAt: '8 months ago'
      }
    ];

    setTimeout(() => {
      setProjects(demoProjects);
      setLoading(false);
    }, 800);
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.language.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'React': 'bg-blue-100 text-blue-800',
      'Node.js': 'bg-green-100 text-green-800',
      'Python': 'bg-yellow-100 text-yellow-800',
      'Terraform': 'bg-purple-100 text-purple-800',
      'React Native': 'bg-cyan-100 text-cyan-800'
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
          <p className="text-muted-foreground">Loading projects...</p>
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
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your development projects</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Status: {filterStatus}
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg">{getVisibilityIcon(project.visibility)}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getLanguageColor(project.language)}>
                      {project.language}
                    </Badge>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4" />
                        <span>{project.stars}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-4 w-4" />
                        <span>{project.forks}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{project.lastCommit}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      by {project.owner} • {project.createdAt}
                    </p>
                    <Button variant="outline" size="sm">
                      <Code className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to get started'}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperProjectsPage;
