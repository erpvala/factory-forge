// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';

// Log entry types
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  PROJECT = 'project',
  REPOSITORY = 'repository',
  COMMIT = 'commit',
  PIPELINE = 'pipeline',
  DEPLOYMENT = 'deployment',
  AUTH = 'auth',
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
  entityId?: string;
  entityType?: string;
  action?: string;
  result?: 'success' | 'failure' | 'pending';
  duration?: number;
  metadata?: Record<string, any>;
}

export interface NotificationEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
}

interface UseDeveloperLoggingProps {
  enableConsoleLogging?: boolean;
  enableLocalStorage?: boolean;
  maxLogEntries?: number;
  maxNotifications?: number;
}

// ID Generator
class IDGenerator {
  private static counter = 0;
  
  static generateId(prefix: string = 'entity'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    this.counter++;
    return `${prefix}_${timestamp}_${random}_${this.counter}`;
  }
  
  static generateProjectId(): string {
    return this.generateId('proj');
  }
  
  static generateRepositoryId(): string {
    return this.generateId('repo');
  }
  
  static generateCommitId(): string {
    return this.generateId('commit');
  }
  
  static generatePipelineId(): string {
    return this.generateId('pipeline');
  }
  
  static generateDeploymentId(): string {
    return this.generateId('deploy');
  }
  
  static generateLogId(): string {
    return this.generateId('log');
  }
  
  static generateNotificationId(): string {
    return this.generateId('notif');
  }
}

// Logging hook
const useDeveloperLogging = ({
  enableConsoleLogging = true,
  enableLocalStorage = true,
  maxLogEntries = 1000,
  maxNotifications = 100
}: UseDeveloperLoggingProps = {}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  // Load logs from localStorage on mount
  useEffect(() => {
    if (enableLocalStorage) {
      try {
        const savedLogs = localStorage.getItem('developer_logs');
        const savedNotifications = localStorage.getItem('developer_notifications');
        
        if (savedLogs) {
          const parsedLogs = JSON.parse(savedLogs);
          setLogs(parsedLogs.slice(-maxLogEntries));
        }
        
        if (savedNotifications) {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications.slice(-maxNotifications));
        }
      } catch (error) {
        console.warn('Failed to load logs from localStorage:', error);
      }
    }
  }, [enableLocalStorage, maxLogEntries, maxNotifications]);

  // Save logs to localStorage
  const saveLogs = useCallback((updatedLogs: LogEntry[]) => {
    if (enableLocalStorage) {
      try {
        localStorage.setItem('developer_logs', JSON.stringify(updatedLogs));
      } catch (error) {
        console.warn('Failed to save logs to localStorage:', error);
      }
    }
  }, [enableLocalStorage]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((updatedNotifications: NotificationEntry[]) => {
    if (enableLocalStorage) {
      try {
        localStorage.setItem('developer_notifications', JSON.stringify(updatedNotifications));
      } catch (error) {
        console.warn('Failed to save notifications to localStorage:', error);
      }
    }
  }, [enableLocalStorage]);

  // Core logging function
  const log = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    metadata?: Record<string, any>
  ) => {
    const logEntry: LogEntry = {
      id: IDGenerator.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      userId: getCurrentUserId(),
      sessionId: getCurrentSessionId(),
      metadata
    };

    setLogs(prev => {
      const updatedLogs = [...prev, logEntry].slice(-maxLogEntries);
      saveLogs(updatedLogs);
      return updatedLogs;
    });

    // Console logging
    if (enableConsoleLogging) {
      const consoleMethod = level === LogLevel.FATAL ? 'error' : level;
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, details || '');
    }

    // Auto-generate notifications for important events
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      createNotification(
        'error',
        `${category.charAt(0).toUpperCase() + category.slice(1)} Error`,
        message,
        logEntry
      );
    }
  }, [enableConsoleLogging, maxLogEntries, saveLogs]);

  // Convenience logging methods
  const debug = useCallback((category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) => {
    log(LogLevel.DEBUG, category, message, details, metadata);
  }, [log]);

  const info = useCallback((category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) => {
    log(LogLevel.INFO, category, message, details, metadata);
  }, [log]);

  const warn = useCallback((category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) => {
    log(LogLevel.WARN, category, message, details, metadata);
  }, [log]);

  const error = useCallback((category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) => {
    log(LogLevel.ERROR, category, message, details, metadata);
  }, [log]);

  const fatal = useCallback((category: LogCategory, message: string, details?: any, metadata?: Record<string, any>) => {
    log(LogLevel.FATAL, category, message, details, metadata);
  }, [log]);

  // Entity-specific logging
  const logEntityAction = useCallback((
    entityType: string,
    entityId: string,
    action: string,
    result: 'success' | 'failure' | 'pending',
    message: string,
    details?: any,
    duration?: number
  ) => {
    const category = entityType.toLowerCase() as LogCategory;
    log(
      result === 'failure' ? LogLevel.ERROR : LogLevel.INFO,
      category,
      message,
      details,
      {
        entityId,
        entityType,
        action,
        result,
        duration,
        ...details
      }
    );
  }, [log]);

  // Create notification
  const createNotification = useCallback((
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    relatedLog?: LogEntry,
    actionUrl?: string,
    actionText?: string
  ) => {
    const notification: NotificationEntry = {
      id: IDGenerator.generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl,
      actionText,
      entityId: relatedLog?.entityId,
      entityType: relatedLog?.entityType,
      metadata: relatedLog?.metadata
    };

    setNotifications(prev => {
      const updatedNotifications = [notification, ...prev].slice(-maxNotifications);
      saveNotifications(updatedNotifications);
      return updatedNotifications;
    });
  }, [maxNotifications, saveNotifications]);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      saveNotifications(updatedNotifications);
      return updatedNotifications;
    });
  }, [saveNotifications]);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(notif => ({ ...notif, read: true }));
      saveNotifications(updatedNotifications);
      return updatedNotifications;
    });
  }, [saveNotifications]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (enableLocalStorage) {
      localStorage.removeItem('developer_notifications');
    }
  }, [enableLocalStorage]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    if (enableLocalStorage) {
      localStorage.removeItem('developer_logs');
    }
  }, [enableLocalStorage]);

  // Get logs by category
  const getLogsByCategory = useCallback((category: LogCategory) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  // Get logs by level
  const getLogsByLevel = useCallback((level: LogLevel) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  // Get unread notifications count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return {
    // State
    logs,
    notifications,
    isLogging,
    unreadCount,

    // ID Generation
    generateId: IDGenerator.generateId,
    generateProjectId: IDGenerator.generateProjectId,
    generateRepositoryId: IDGenerator.generateRepositoryId,
    generateCommitId: IDGenerator.generateCommitId,
    generatePipelineId: IDGenerator.generatePipelineId,
    generateDeploymentId: IDGenerator.generateDeploymentId,

    // Logging Methods
    debug,
    info,
    warn,
    error,
    fatal,
    log,
    logEntityAction,

    // Notification Methods
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,

    // Utility Methods
    getLogsByCategory,
    getLogsByLevel,
    clearLogs
  };
};

// Helper functions
const getCurrentUserId = (): string | undefined => {
  try {
    const session = localStorage.getItem('developer_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.id;
    }
  } catch (error) {
    // Ignore
  }
  return undefined;
};

const getCurrentSessionId = (): string | undefined => {
  try {
    const session = localStorage.getItem('developer_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.id;
    }
  } catch (error) {
    // Ignore
  }
  return undefined;
};

export default useDeveloperLogging;
export { IDGenerator };
