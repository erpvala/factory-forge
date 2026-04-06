// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';

// Types
interface LogEntry {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  level: 'info' | 'warning' | 'error' | 'success';
  module: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  entityId?: string;
  module: string;
}

interface IDSystem {
  generateId: (type: string, data?: any) => string;
  extractInfo: (id: string) => { type: string; timestamp: number; data?: any };
}

// ID System Implementation
class ResellerIDSystem implements IDSystem {
  private prefix = 'RSL';
  
  generateId(type: string, data?: any): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const dataHash = data ? btoa(JSON.stringify(data)).substring(0, 6) : '';
    return `${this.prefix}-${type}-${timestamp}-${random}${dataHash ? '-' + dataHash : ''}`;
  }

  extractInfo(id: string): { type: string; timestamp: number; data?: any } {
    const parts = id.split('-');
    if (parts.length < 4) throw new Error('Invalid ID format');
    
    return {
      type: parts[1],
      timestamp: parseInt(parts[2]),
      data: parts[4] ? JSON.parse(atob(parts[4])) : undefined
    };
  }
}

// Logging and Notification Hook
export const useResellerLoggingNotification = (userId: string) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const idSystem = new ResellerIDSystem();

  // Generate unique ID
  const generateId = useCallback((type: string, data?: any) => {
    return idSystem.generateId(type, data);
  }, []);

  // Log action
  const logAction = useCallback((
    action: string,
    entity: string,
    entityId: string,
    details: Record<string, any> = {},
    level: LogEntry['level'] = 'info',
    module: string = 'reseller'
  ) => {
    const logEntry: LogEntry = {
      id: generateId('LOG', { action, entity }),
      timestamp: Date.now(),
      userId,
      action,
      entity,
      entityId,
      details,
      level,
      module
    };

    setLogs(prev => [logEntry, ...prev].slice(0, 1000)); // Keep last 1000 logs

    // Store in localStorage for persistence
    try {
      const existingLogs = JSON.parse(localStorage.getItem(`reseller_logs_${userId}`) || '[]');
      existingLogs.unshift(logEntry);
      localStorage.setItem(`reseller_logs_${userId}`, JSON.stringify(existingLogs.slice(0, 1000)));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }

    return logEntry.id;
  }, [userId, generateId]);

  // Create notification
  const createNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    entityId?: string,
    module: string = 'reseller',
    action?: Notification['action']
  ) => {
    const notification: Notification = {
      id: generateId('NOTIF', { type, title }),
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      entityId,
      module,
      action
    };

    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100 notifications

    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Store in localStorage
    try {
      const existingNotifications = JSON.parse(localStorage.getItem(`reseller_notifications_${userId}`) || '[]');
      existingNotifications.unshift(notification);
      localStorage.setItem(`reseller_notifications_${userId}`, JSON.stringify(existingNotifications.slice(0, 100)));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    return notification.id;
  }, [userId, generateId]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, [notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get logs by entity
  const getLogsByEntity = useCallback((entityId: string) => {
    return logs.filter(log => log.entityId === entityId);
  }, [logs]);

  // Get logs by action
  const getLogsByAction = useCallback((action: string) => {
    return logs.filter(log => log.action === action);
  }, [logs]);

  // Get logs by date range
  const getLogsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return logs.filter(log => 
      log.timestamp >= startDate.getTime() && log.timestamp <= endDate.getTime()
    );
  }, [logs]);

  // Real-time sync simulation
  const simulateRealTimeUpdate = useCallback(() => {
    // Simulate incoming notifications
    const randomNotifications = [
      {
        type: 'success' as const,
        title: 'New Sale Completed',
        message: 'Customer has completed a purchase',
        module: 'sales' as const
      },
      {
        type: 'info' as const,
        title: 'License Generated',
        message: 'New license has been generated',
        module: 'licenses' as const
      },
      {
        type: 'warning' as const,
        title: 'Support Ticket Updated',
        message: 'Customer has replied to support ticket',
        module: 'support' as const
      }
    ];

    // Randomly trigger notifications (for demo)
    if (Math.random() > 0.95) {
      const notif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
      createNotification(notif.type, notif.title, notif.message, undefined, notif.module);
    }
  }, [createNotification]);

  // Load persisted data on mount
  useEffect(() => {
    try {
      const savedLogs = JSON.parse(localStorage.getItem(`reseller_logs_${userId}`) || '[]');
      const savedNotifications = JSON.parse(localStorage.getItem(`reseller_notifications_${userId}`) || '[]');
      
      setLogs(savedLogs);
      setNotifications(savedNotifications);
      setUnreadCount(savedNotifications.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Failed to load persisted data:', error);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [userId]);

  // Set up real-time simulation
  useEffect(() => {
    const interval = setInterval(simulateRealTimeUpdate, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [simulateRealTimeUpdate]);

  return {
    // ID System
    generateId,
    extractIdInfo: idSystem.extractInfo.bind(idSystem),
    
    // Logging
    logs,
    logAction,
    getLogsByEntity,
    getLogsByAction,
    getLogsByDateRange,
    
    // Notifications
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    
    // Real-time
    simulateRealTimeUpdate
  };
};

// Specific logging functions for common actions
export const useResellerActionLogger = (userId: string) => {
  const { logAction, createNotification } = useResellerLoggingNotification(userId);

  const logCustomerAction = useCallback((action: string, customerId: string, details?: any) => {
    const logId = logAction(action, 'customer', customerId, details);
    
    // Create notification for important actions
    if (['created', 'updated', 'deleted'].includes(action)) {
      createNotification(
        'success',
        `Customer ${action}`,
        `Customer has been ${action} successfully`,
        customerId,
        'customers'
      );
    }
    
    return logId;
  }, [logAction, createNotification]);

  const logSaleAction = useCallback((action: string, saleId: string, details?: any) => {
    const logId = logAction(action, 'sale', saleId, details);
    
    if (action === 'completed') {
      createNotification(
        'success',
        'Sale Completed',
        `Sale #${saleId} has been completed successfully`,
        saleId,
        'sales'
      );
    }
    
    return logId;
  }, [logAction, createNotification]);

  const logLicenseAction = useCallback((action: string, licenseId: string, details?: any) => {
    const logId = logAction(action, 'license', licenseId, details);
    
    if (action === 'generated') {
      createNotification(
        'success',
        'License Generated',
        `License ${licenseId} has been generated`,
        licenseId,
        'licenses'
      );
    }
    
    return logId;
  }, [logAction, createNotification]);

  const logSupportAction = useCallback((action: string, ticketId: string, details?: any) => {
    const logId = logAction(action, 'support_ticket', ticketId, details);
    
    if (action === 'created') {
      createNotification(
        'info',
        'Support Ticket Created',
        `Ticket #${ticketId} has been created`,
        ticketId,
        'support'
      );
    }
    
    return logId;
  }, [logAction, createNotification]);

  return {
    logCustomerAction,
    logSaleAction,
    logLicenseAction,
    logSupportAction
  };
};

export default useResellerLoggingNotification;
