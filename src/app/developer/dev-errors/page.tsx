// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  RefreshCw,
  MoreHorizontal,
  Filter,
  Calendar,
  Clock,
  Server,
  Code,
  Eye,
  Bug,
  Zap
} from 'lucide-react';

interface Error {
  id: string;
  timestamp: string;
  level: 'critical' | 'error' | 'warning';
  message: string;
  stackTrace?: string;
  source: string;
  service: string;
  environment: 'development' | 'staging' | 'production';
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'investigating' | 'resolved';
  assignedTo?: string;
  metadata?: {
    userId?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  };
}

const DeveloperErrorsPage: React.FC = () => {
  const [errors, setErrors] = useState<Error[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoErrors: Error[] = [
      {
        id: 'error_1',
        timestamp: '2024-01-15 10:30:45',
        level: 'critical',
        message: 'Database connection pool exhausted',
        stackTrace: 'Error: Connection pool exhausted\n    at Database.connect (db.js:45)\n    at UserService.authenticate (auth.js:23)',
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
      },
      {
        id: 'error_3',
        timestamp: '2024-01-15 10:28:33',
        level: 'warning',
        message: 'High memory usage detected',
        source: 'system-monitor',
        service: 'analytics-dashboard',
        environment: 'staging',
        occurrences: 3,
        firstSeen: '6 hours ago',
        lastSeen: '30 minutes ago',
        status: 'resolved'
      },
      {
        id: 'error_4',
        timestamp: '2024-01-15 10:27:18',
        level: 'critical',
        message: 'API rate limit exceeded',
        source: 'api-gateway',
        service: 'mobile-api-backend',
        environment: 'production',
        occurrences: 25,
        firstSeen: '1 day ago',
        lastSeen: '10 minutes ago',
        status: 'open'
      }
    ];

    setTimeout(() => {
      setErrors(demoErrors);
      setLoading(false);
    }, 800);
  }, []);

  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         error.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         error.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || error.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || error.status === filterStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800',
      'error': 'bg-orange-100 text-orange-800',
      'warning': 'bg-yellow-100 text-yellow-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'open': 'bg-red-100 text-red-800',
      'investigating': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading errors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Errors</h1>
            <p className="text-muted-foreground">Monitor and track application errors</p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search errors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Level: {filterLevel}
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Status: {filterStatus}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {errors.filter(e => e.level === 'critical').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {errors.filter(e => e.level === 'error').length}
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
                {errors.filter(e => e.level === 'warning').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Bug className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {errors.filter(e => e.status === 'open').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredErrors.map((error) => (
            <Card key={error.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getLevelIcon(error.level)}
                    <div>
                      <h3 className="text-lg font-semibold">{error.message}</h3>
                      <p className="text-sm text-muted-foreground">
                        {error.source} • {error.service}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getLevelColor(error.level)}>
                      {error.level.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(error.status)}>
                      {error.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4" />
                      <span>{error.occurrences} occurrences</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>First: {error.firstSeen}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Last: {error.lastSeen}</span>
                    </div>
                    {error.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <Server className="h-4 w-4" />
                        <span>Assigned to: {error.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error.stackTrace && (
                  <div className="bg-muted p-3 rounded mb-4">
                    <p className="text-sm font-mono text-red-600">{error.stackTrace}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {error.status === 'open' && (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {error.environment}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeveloperErrorsPage;
