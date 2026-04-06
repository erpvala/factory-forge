// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  Download,
  Filter,
  Calendar,
  Clock,
  Server,
  Code,
  Eye
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'success';
  message: string;
  source: string;
  service: string;
  environment: 'development' | 'staging' | 'production';
  metadata?: {
    userId?: string;
    requestId?: string;
    ip?: string;
  };
  details?: string;
}

const DeveloperLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoLogs: LogEntry[] = [
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
        details: 'Connection timeout after 30 seconds. Retrying...'
      },
      {
        id: 'log_3',
        timestamp: '2024-01-15 10:28:33',
        level: 'warning',
        message: 'High memory usage detected',
        source: 'system-monitor',
        service: 'ecommerce-frontend',
        environment: 'staging',
        details: 'Memory usage at 85%. Consider scaling up.'
      },
      {
        id: 'log_4',
        timestamp: '2024-01-15 10:27:18',
        level: 'success',
        message: 'Deployment completed successfully',
        source: 'deploy-service',
        service: 'devops-automation',
        environment: 'production',
        details: 'Version v2.3.1 deployed to production servers.'
      },
      {
        id: 'log_5',
        timestamp: '2024-01-15 10:26:45',
        level: 'debug',
        message: 'API request processed',
        source: 'api-gateway',
        service: 'mobile-api-backend',
        environment: 'development',
        details: 'GET /api/users/123 - 200 OK - 45ms'
      }
    ];

    setTimeout(() => {
      setLogs(demoLogs);
      setLoading(false);
    }, 800);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'debug':
        return <Code className="h-4 w-4 text-gray-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'info': 'bg-blue-100 text-blue-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
      'debug': 'bg-gray-100 text-gray-800',
      'success': 'bg-green-100 text-green-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs</h1>
            <p className="text-muted-foreground">Monitor and analyze application logs</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Level: {filterLevel}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Info</CardTitle>
              <Info className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(l => l.level === 'info').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.level === 'warning').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.level === 'error').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Debug</CardTitle>
              <Code className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {logs.filter(l => l.level === 'debug').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.level === 'success').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getLevelIcon(log.level)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.timestamp}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold mb-1">{log.message}</h4>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{log.source}</span>
                        <span>•</span>
                        <span>{log.service}</span>
                        <span>•</span>
                        <span>{log.environment}</span>
                      </div>
                      
                      {log.details && (
                        <div className="bg-muted p-2 rounded text-sm mt-2">
                          <p className="font-mono">{log.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperLogsPage;
