// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
  notFound?: boolean;
}

const DeveloperErrorPage: React.FC<ErrorPageProps> = ({ 
  error, 
  reset, 
  notFound = false 
}) => {
  const navigate = useNavigate();
  const title = notFound ? 'Page Not Found' : 'Something went wrong';
  const description = notFound 
    ? 'The developer page you are looking for does not exist or has been moved.'
    : 'An unexpected error occurred while loading this page.';

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      navigate('/developer/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-orange-600">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {description}
            </p>
            
            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800 font-mono">
                  {error.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleRetry} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Link to="/developer/dashboard">
                <Button className="w-full" variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/developer/projects" className="text-blue-600 hover:underline">
                Projects
              </Link>
              <Link to="/developer/repositories" className="text-blue-600 hover:underline">
                Repositories
              </Link>
              <Link to="/developer/commits" className="text-blue-600 hover:underline">
                Commits
              </Link>
              <Link to="/developer/pipelines" className="text-blue-600 hover:underline">
                Pipelines
              </Link>
              <Link to="/developer/deployments" className="text-blue-600 hover:underline">
                Deployments
              </Link>
              <Link to="/developer/dev-logs" className="text-blue-600 hover:underline">
                Logs
              </Link>
              <Link to="/developer/dev-errors" className="text-blue-600 hover:underline">
                Errors
              </Link>
              <Link to="/developer/dev-api" className="text-blue-600 hover:underline">
                API
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperErrorPage;
