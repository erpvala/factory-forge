// @ts-nocheck
import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  action: string;
  module: string;
  user_id?: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ip_address?: string;
  user_agent?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user if not provided
      if (!entry.user_id) {
        const { data: userData } = await supabase.auth.getUser();
        entry.user_id = userData?.user?.id;
      }
      
      // Add client context
      const auditEntry = {
        ...entry,
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
        severity: entry.severity || 'info'
      };
      
      // Insert into audit_logs table
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);
      
      if (error) {
        console.error('Failed to log audit entry:', error);
        // Fallback to local storage if database fails
        this.logToLocalStorage(auditEntry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Fallback to local storage
      this.logToLocalStorage(entry);
    }
  }
  
  async logModuleAction(
    module: string,
    action: string,
    metadata?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    await this.log({
      action,
      module,
      metadata,
      severity
    });
  }
  
  async logUserAction(
    action: string,
    module: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      module,
      user_id: userId,
      metadata
    });
  }
  
  async logSecurityEvent(
    action: string,
    metadata: Record<string, any>,
    userId?: string
  ): Promise<void> {
    await this.log({
      action,
      module: 'security',
      user_id: userId,
      metadata,
      severity: 'critical'
    });
  }
  
  async logError(
    error: Error,
    module: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'error_occurred',
      module,
      metadata: {
        error_message: error.message,
        error_stack: error.stack,
        ...metadata
      },
      severity: 'error'
    });
  }
  
  async logAPIResponse(
    apiEndpoint: string,
    method: string,
    responseStatus: number,
    responseTime: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'api_response',
      module: 'api',
      metadata: {
        endpoint: apiEndpoint,
        method,
        status_code: responseStatus,
        response_time_ms: responseTime,
        ...metadata
      },
      severity: responseStatus >= 400 ? 'warning' : 'info'
    });
  }
  
  async getAuditLogs(filters?: {
    module?: string;
    user_id?: string;
    action?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.module) {
        query = query.eq('module', filters.module);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }
  
  private getClientIP(): string {
    // In a real implementation, this would get the client IP from headers or API
    // For now, return a placeholder
    return 'client_ip_unknown';
  }
  
  private logToLocalStorage(entry: AuditLogEntry): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('audit_logs_fallback') || '[]');
      existingLogs.push({
        ...entry,
        created_at: new Date().toISOString(),
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent
      });
      
      // Keep only last 1000 entries in localStorage
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('audit_logs_fallback', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to log to localStorage:', error);
    }
  }
  
  async syncLocalStorageLogs(): Promise<void> {
    try {
      const fallbackLogs = JSON.parse(localStorage.getItem('audit_logs_fallback') || '[]');
      
      if (fallbackLogs.length === 0) {
        return;
      }
      
      // Batch insert fallback logs to database
      const { error } = await supabase
        .from('audit_logs')
        .insert(fallbackLogs);
      
      if (!error) {
        // Clear fallback logs after successful sync
        localStorage.removeItem('audit_logs_fallback');
      } else {
        console.error('Failed to sync fallback logs:', error);
      }
    } catch (error) {
      console.error('Error syncing localStorage logs:', error);
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common audit actions
export const logModuleLoad = (module: string, metadata?: Record<string, any>) => 
  auditLogger.logModuleAction(module, 'module_loaded', metadata);

export const logUserInteraction = (module: string, action: string, metadata?: Record<string, any>) => 
  auditLogger.logModuleAction(module, `user_${action}`, metadata);

export const logDataAccess = (module: string, resource: string, metadata?: Record<string, any>) => 
  auditLogger.logModuleAction(module, 'data_access', { resource, ...metadata });

export const logDataModification = (module: string, operation: string, metadata?: Record<string, any>) => 
  auditLogger.logModuleAction(module, `data_${operation}`, metadata);

export const logNavigation = (from: string, to: string, metadata?: Record<string, any>) => 
  auditLogger.logModuleAction('navigation', 'route_change', { from, to, ...metadata });

export const logError = (error: Error, module: string, metadata?: Record<string, any>) => 
  auditLogger.logError(error, module, metadata);

export const logSecurityEvent = (action: string, metadata: Record<string, any>, userId?: string) => 
  auditLogger.logSecurityEvent(action, metadata, userId);
