// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  ExternalLink,
  Clock,
  User,
  FolderOpen,
  GitBranch,
  GitCommit,
  Activity,
  Cloud
} from 'lucide-react';
import { NotificationEntry } from '@/hooks/useDeveloperLogging';

interface DeveloperNotificationsProps {
  notifications: NotificationEntry[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  unreadCount: number;
}

const DeveloperTraceableNotifications: React.FC<DeveloperNotificationsProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear,
  unreadCount
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case 'project':
        return <FolderOpen className="h-3 w-3" />;
      case 'repository':
        return <GitBranch className="h-3 w-3" />;
      case 'commit':
        return <GitCommit className="h-3 w-3" />;
      case 'pipeline':
        return <Activity className="h-3 w-3" />;
      case 'deployment':
        return <Cloud className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: NotificationEntry) => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      try {
        const url = new URL(notification.actionUrl, window.location.origin);
        if (url.origin === window.location.origin) {
          navigate(`${url.pathname}${url.search}${url.hash}`);
          return;
        }
        window.location.href = notification.actionUrl;
        return;
      } catch {
        navigate(notification.actionUrl);
        return;
      }
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? 'bg-muted/30 border-primary/20' : 'bg-background'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.entityType && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    {getEntityIcon(notification.entityType)}
                                    <span>{notification.entityType}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {notification.actionUrl && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {notification.actionText && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.actionText}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Notification Toast Component
interface NotificationToastProps {
  notification: NotificationEntry;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Auto-close after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-80 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperTraceableNotifications;
