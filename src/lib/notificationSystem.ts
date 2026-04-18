// @ts-nocheck
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Notification {
  id?: string;
  user_id?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  module?: string;
  action_url?: string;
  action_text?: string;
  is_read?: boolean;
  created_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

class NotificationSystem {
  private static instance: NotificationSystem;
  private subscribers: Map<string, (notifications: Notification[]) => void> = new Map();
  private currentUserId: string | null = null;
  
  private constructor() {
    this.setupRealtimeSubscription();
  }
  
  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }
  
  async setCurrentUser(userId: string): Promise<void> {
    this.currentUserId = userId;
    await this.loadNotifications();
  }
  
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<string | null> {
    try {
      // Get current user if not provided
      if (!notification.user_id && this.currentUserId) {
        notification.user_id = this.currentUserId;
      }
      
      const notificationData = {
        ...notification,
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create notification:', error);
        return null;
      }
      
      // Show toast notification for immediate feedback
      this.showToast(notification);
      
      return data.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
  
  async getUserNotifications(userId?: string): Promise<Notification[]> {
    try {
      const targetUserId = userId || this.currentUserId;
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
  
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  async markAllAsRead(userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.currentUserId;
      if (!targetUserId) return false;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', targetUserId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Failed to mark all notifications as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Failed to delete notification:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
  
  subscribe(callback: (notifications: Notification[]) => void): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);
    return id;
  }
  
  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }
  
  private async loadNotifications(): Promise<void> {
    if (!this.currentUserId) return;
    
    const notifications = await this.getUserNotifications();
    this.notifySubscribers(notifications);
  }
  
  private notifySubscribers(notifications: Notification[]): void {
    this.subscribers.forEach(callback => callback(notifications));
  }
  
  private setupRealtimeSubscription(): void {
    supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${this.currentUserId}`
        },
        () => this.loadNotifications()
      )
      .subscribe();
  }
  
  private showToast(notification: Notification): void {
    const toastOptions = {
      duration: notification.type === 'critical' ? 10000 : 5000,
      action: notification.action_url ? {
        label: notification.action_text || 'View',
        onClick: () => {
          window.location.href = notification.action_url!;
        }
      } : undefined
    };
    
    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        break;
      case 'error':
      case 'critical':
        toast.error(notification.title, toastOptions);
        break;
      default:
        toast.info(notification.title, toastOptions);
    }
  }
  
  // Convenience methods for common notification types
  async notifySuccess(title: string, message: string, module?: string, actionUrl?: string): Promise<string | null> {
    return this.createNotification({
      type: 'success',
      title,
      message,
      module,
      action_url: actionUrl,
      action_text: 'View'
    });
  }
  
  async notifyError(title: string, message: string, module?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.createNotification({
      type: 'error',
      title,
      message,
      module,
      metadata
    });
  }
  
  async notifyWarning(title: string, message: string, module?: string, actionUrl?: string): Promise<string | null> {
    return this.createNotification({
      type: 'warning',
      title,
      message,
      module,
      action_url: actionUrl,
      action_text: 'View'
    });
  }
  
  async notifyInfo(title: string, message: string, module?: string, actionUrl?: string): Promise<string | null> {
    return this.createNotification({
      type: 'info',
      title,
      message,
      module,
      action_url: actionUrl,
      action_text: 'View'
    });
  }
  
  async notifyCritical(title: string, message: string, module?: string, metadata?: Record<string, any>): Promise<string | null> {
    return this.createNotification({
      type: 'critical',
      title,
      message,
      module,
      metadata
    });
  }
  
  // Module-specific notifications
  async notifyModuleAction(module: string, action: string, success: boolean, details?: string): Promise<string | null> {
    const title = `${module} - ${action}`;
    const message = details || (success ? 'Action completed successfully' : 'Action failed');
    const type = success ? 'success' : 'error';
    
    return this.createNotification({
      type,
      title,
      message,
      module
    });
  }
  
  async notifyDataChange(module: string, operation: string, entity: string, success: boolean): Promise<string | null> {
    const title = `${module} - Data ${operation}`;
    const message = `${entity} ${success ? 'updated successfully' : 'update failed'}`;
    const type = success ? 'success' : 'error';
    
    return this.createNotification({
      type,
      title,
      message,
      module,
      metadata: { operation, entity }
    });
  }
  
  async notifySystemAlert(title: string, message: string, severity: 'warning' | 'error' | 'critical' = 'warning'): Promise<string | null> {
    return this.createNotification({
      type: severity,
      title,
      message,
      module: 'system'
    });
  }
  
  async notifyPaymentStatus(paymentId: string, status: 'success' | 'failed' | 'pending', amount?: number): Promise<string | null> {
    const title = `Payment ${status}`;
    const message = amount ? `Payment of $${amount} ${status}` : `Payment ${status}`;
    const type = status === 'success' ? 'success' : status === 'failed' ? 'error' : 'warning';
    
    return this.createNotification({
      type,
      title,
      message,
      module: 'payments',
      action_url: `/payments/${paymentId}`,
      action_text: 'View Details',
      metadata: { payment_id: paymentId, status, amount }
    });
  }
  
  async notifyTaskUpdate(taskId: string, status: string, assignee?: string): Promise<string | null> {
    const title = `Task ${status}`;
    const message = assignee ? `Task assigned to ${assignee} is now ${status}` : `Task status updated to ${status}`;
    
    return this.createNotification({
      type: 'info',
      title,
      message,
      module: 'tasks',
      action_url: `/tasks/${taskId}`,
      action_text: 'View Task',
      metadata: { task_id: taskId, status, assignee }
    });
  }
  
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (error) {
        console.error('Failed to cleanup expired notifications:', error);
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationSystem = NotificationSystem.getInstance();

// Convenience functions for common notification patterns
export const notifySuccess = (title: string, message: string, module?: string) => 
  notificationSystem.notifySuccess(title, message, module);

export const notifyError = (title: string, message: string, module?: string) => 
  notificationSystem.notifyError(title, message, module);

export const notifyWarning = (title: string, message: string, module?: string) => 
  notificationSystem.notifyWarning(title, message, module);

export const notifyInfo = (title: string, message: string, module?: string) => 
  notificationSystem.notifyInfo(title, message, module);

export const notifyCritical = (title: string, message: string, module?: string) => 
  notificationSystem.notifyCritical(title, message, module);

export const notifyModuleAction = (module: string, action: string, success: boolean, details?: string) => 
  notificationSystem.notifyModuleAction(module, action, success, details);

export const notifyDataChange = (module: string, operation: string, entity: string, success: boolean) => 
  notificationSystem.notifyDataChange(module, operation, entity, success);

export const notifySystemAlert = (title: string, message: string, severity?: 'warning' | 'error' | 'critical') => 
  notificationSystem.notifySystemAlert(title, message, severity);

export const notifyPaymentStatus = (paymentId: string, status: 'success' | 'failed' | 'pending', amount?: number) => 
  notificationSystem.notifyPaymentStatus(paymentId, status, amount);

export const notifyTaskUpdate = (taskId: string, status: string, assignee?: string) => 
  notificationSystem.notifyTaskUpdate(taskId, status, assignee);
