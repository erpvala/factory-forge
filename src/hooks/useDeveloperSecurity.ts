// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Security types
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ThreatType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  AUTH_BYPASS = 'auth_bypass',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  BRUTE_FORCE = 'brute_force',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export interface SecurityEvent {
  id: string;
  type: ThreatType;
  level: SecurityLevel;
  message: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  blocked: boolean;
  details?: any;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: SecurityRule[];
  actions: SecurityAction[];
}

export interface SecurityRule {
  type: ThreatType;
  conditions: RuleCondition[];
  threshold?: number;
  timeWindow?: number; // in minutes
}

export interface SecurityAction {
  type: 'block' | 'alert' | 'log' | 'quarantine' | 'escalate';
  config: any;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'greater_than' | 'less_than';
  value: any;
}

interface UseDeveloperSecurityProps {
  enableRealTimeProtection?: boolean;
  enableThreatDetection?: boolean;
  enableAuditLogging?: boolean;
  maxSecurityEvents?: number;
}

// Security hook
const useDeveloperSecurity = ({
  enableRealTimeProtection = true,
  enableThreatDetection = true,
  enableAuditLogging = true,
  maxSecurityEvents = 1000
}: UseDeveloperSecurityProps = {}) => {
  const router = useRouter();
  
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);
  const [threatLevel, setThreatLevel] = useState<SecurityLevel>(SecurityLevel.LOW);
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  const [suspiciousActivities, setSuspiciousActivities] = useState<Map<string, number>>(new Map());

  // Initialize default security policies
  useEffect(() => {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'sql-injection-protection',
        name: 'SQL Injection Protection',
        description: 'Detect and block SQL injection attempts',
        enabled: true,
        rules: [
          {
            type: ThreatType.SQL_INJECTION,
            conditions: [
              { field: 'input', operator: 'contains', value: 'UNION' },
              { field: 'input', operator: 'contains', value: 'SELECT' },
              { field: 'input', operator: 'contains', value: 'DROP' }
            ]
          }
        ],
        actions: [
          { type: 'block', config: {} },
          { type: 'alert', config: { level: 'high' } }
        ]
      },
      {
        id: 'xss-protection',
        name: 'XSS Protection',
        description: 'Detect and block cross-site scripting attempts',
        enabled: true,
        rules: [
          {
            type: ThreatType.XSS,
            conditions: [
              { field: 'input', operator: 'contains', value: '<script>' },
              { field: 'input', operator: 'contains', value: 'javascript:' },
              { field: 'input', operator: 'regex', value: /on\w+=/gi }
            ]
          }
        ],
        actions: [
          { type: 'block', config: {} },
          { type: 'alert', config: { level: 'high' } }
        ]
      },
      {
        id: 'brute-force-protection',
        name: 'Brute Force Protection',
        description: 'Detect and block brute force login attempts',
        enabled: true,
        rules: [
          {
            type: ThreatType.BRUTE_FORCE,
            conditions: [
              { field: 'action', operator: 'equals', value: 'login_failed' }
            ],
            threshold: 5,
            timeWindow: 15 // 15 minutes
          }
        ],
        actions: [
          { type: 'block', config: { duration: 300 } }, // 5 minutes
          { type: 'alert', config: { level: 'medium' } }
        ]
      },
      {
        id: 'privilege-escalation-protection',
        name: 'Privilege Escalation Protection',
        description: 'Detect attempts to access unauthorized resources',
        enabled: true,
        rules: [
          {
            type: ThreatType.PRIVILEGE_ESCALATION,
            conditions: [
              { field: 'access_denied', operator: 'equals', value: true }
            ],
            threshold: 3,
            timeWindow: 10 // 10 minutes
          }
        ],
        actions: [
          { type: 'escalate', config: { level: 'critical' } },
          { type: 'quarantine', config: {} }
        ]
      }
    ];

    setSecurityPolicies(defaultPolicies);
  }, []);

  // Input validation and sanitization
  const validateInput = useCallback((
    input: string,
    context: string = 'general'
  ): { isValid: boolean; threats: ThreatType[]; sanitizedInput: string } => {
    if (!isSecurityEnabled) {
      return { isValid: true, threats: [], sanitizedInput: input };
    }

    const threats: ThreatType[] = [];
    let sanitizedInput = input;

    // SQL Injection detection
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bSELECT\b.*\bFROM\b)/gi,
      /(\bDROP\b.*\bTABLE\b)/gi,
      /(\bINSERT\b.*\bINTO\b)/gi,
      /(\bUPDATE\b.*\bSET\b)/gi,
      /(\bDELETE\b.*\bFROM\b)/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        threats.push(ThreatType.SQL_INJECTION);
        sanitizedInput = sanitizedInput.replace(pattern, '');
      }
    }

    // XSS detection
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        threats.push(ThreatType.XSS);
        sanitizedInput = sanitizedInput.replace(pattern, '');
      }
    }

    // Additional sanitization
    sanitizedInput = sanitizedInput
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();

    const isValid = threats.length === 0;

    if (!isValid && enableThreatDetection) {
      logSecurityEvent(
        threats[0],
        SecurityLevel.HIGH,
        `Threat detected in ${context}: ${threats.join(', ')}`,
        { input, context, detectedThreats: threats }
      );
    }

    return { isValid, threats, sanitizedInput };
  }, [isSecurityEnabled, enableThreatDetection]);

  // Access control
  const checkAccess = useCallback((
    resource: string,
    action: string,
    userId?: string
  ): { allowed: boolean; reason?: string } => {
    if (!isSecurityEnabled) {
      return { allowed: true };
    }

    // Get user session
    const session = localStorage.getItem('developer_session');
    if (!session) {
      logSecurityEvent(
        ThreatType.AUTH_BYPASS,
        SecurityLevel.MEDIUM,
        'Access attempt without session',
        { resource, action }
      );
      return { allowed: false, reason: 'No session found' };
    }

    try {
      const parsed = JSON.parse(session);
      const userRole = parsed.role;
      const permissions = parsed.permissions || [];

      // Check role-based access
      const requiredPermission = `${resource}:${action}`;
      const hasPermission = permissions.includes(requiredPermission) || 
                           permissions.includes(`${resource}:*`) ||
                           permissions.includes('*:*');

      if (!hasPermission) {
        logSecurityEvent(
          ThreatType.PRIVILEGE_ESCALATION,
          SecurityLevel.MEDIUM,
          `Access denied for ${requiredPermission}`,
          { userId: parsed.id, userRole, resource, action }
        );
        return { allowed: false, reason: 'Insufficient permissions' };
      }

      return { allowed: true };

    } catch (error) {
      logSecurityEvent(
        ThreatType.AUTH_BYPASS,
        SecurityLevel.HIGH,
        'Invalid session format',
        { resource, action, error: error instanceof Error ? error.message : 'Unknown error' }
      );
      return { allowed: false, reason: 'Invalid session' };
    }
  }, [isSecurityEnabled]);

  // Rate limiting
  const checkRateLimit = useCallback((
    key: string,
    limit: number,
    windowMs: number = 60000 // 1 minute default
  ): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests from storage
    const storageKey = `rate_limit_${key}`;
    const requests = JSON.parse(localStorage.getItem(storageKey) || '[]')
      .filter((timestamp: number) => timestamp > windowStart);

    const allowed = requests.length < limit;
    const remaining = Math.max(0, limit - requests.length);
    const resetTime = requests.length > 0 ? Math.max(...requests) + windowMs : now + windowMs;

    if (allowed) {
      requests.push(now);
      localStorage.setItem(storageKey, JSON.stringify(requests));
    } else {
      logSecurityEvent(
        ThreatType.BRUTE_FORCE,
        SecurityLevel.MEDIUM,
        `Rate limit exceeded for ${key}`,
        { key, limit, windowMs, requestCount: requests.length }
      );
    }

    return { allowed, remaining, resetTime };
  }, []);

  // IP blocking
  const blockIP = useCallback((ip: string, durationMinutes: number = 60) => {
    const blockedUntil = Date.now() + (durationMinutes * 60 * 1000);
    
    setBlockedIPs(prev => new Set(prev).add(ip));
    
    // Store in localStorage with expiry
    const blockedIPs = JSON.parse(localStorage.getItem('blocked_ips') || '{}');
    blockedIPs[ip] = blockedUntil;
    localStorage.setItem('blocked_ips', JSON.stringify(blockedIPs));

    logSecurityEvent(
      ThreatType.BRUTE_FORCE,
      SecurityLevel.HIGH,
      `IP blocked: ${ip}`,
      { ip, durationMinutes, blockedUntil }
    );
  }, []);

  const isIPBlocked = useCallback((ip: string): boolean => {
    const blockedIPs = JSON.parse(localStorage.getItem('blocked_ips') || '{}');
    const blockedUntil = blockedIPs[ip];
    
    if (!blockedUntil) return false;
    
    if (Date.now() > blockedUntil) {
      // Expired, remove from storage
      delete blockedIPs[ip];
      localStorage.setItem('blocked_ips', JSON.stringify(blockedIPs));
      return false;
    }
    
    return true;
  }, []);

  // Security event logging
  const logSecurityEvent = useCallback((
    type: ThreatType,
    level: SecurityLevel,
    message: string,
    details?: any
  ) => {
    if (!enableAuditLogging) return;

    const event: SecurityEvent = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      message,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      sessionId: getCurrentSessionId(),
      ipAddress: getCurrentIP(),
      userAgent: navigator.userAgent,
      blocked: level === SecurityLevel.CRITICAL,
      details
    };

    setSecurityEvents(prev => {
      const updated = [event, ...prev].slice(0, maxSecurityEvents);
      
      // Store in localStorage
      try {
        localStorage.setItem('security_events', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to store security events:', error);
      }
      
      return updated;
    });

    // Update threat level
    updateThreatLevel();

    // Block if critical
    if (level === SecurityLevel.CRITICAL) {
      handleCriticalThreat(event);
    }
  }, [enableAuditLogging, maxSecurityEvents]);

  // Threat level calculation
  const updateThreatLevel = useCallback(() => {
    const recentEvents = securityEvents.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 300000 // 5 minutes
    );

    const criticalCount = recentEvents.filter(e => e.level === SecurityLevel.CRITICAL).length;
    const highCount = recentEvents.filter(e => e.level === SecurityLevel.HIGH).length;
    const mediumCount = recentEvents.filter(e => e.level === SecurityLevel.MEDIUM).length;

    let newThreatLevel = SecurityLevel.LOW;
    
    if (criticalCount > 0) {
      newThreatLevel = SecurityLevel.CRITICAL;
    } else if (highCount >= 3) {
      newThreatLevel = SecurityLevel.HIGH;
    } else if (highCount >= 1 || mediumCount >= 5) {
      newThreatLevel = SecurityLevel.MEDIUM;
    }

    setThreatLevel(newThreatLevel);
  }, [securityEvents]);

  // Critical threat handling
  const handleCriticalThreat = useCallback((event: SecurityEvent) => {
    // Log out current user
    localStorage.removeItem('developer_session');
    
    // Block IP if available
    if (event.ipAddress) {
      blockIP(event.ipAddress, 1440); // 24 hours
    }
    
    // Redirect to security page
    router.push('/security-lockdown');
    
    // Show security alert
    alert('Security threat detected. Session terminated for your safety.');
  }, [blockIP, router]);

  // Data encryption
  const encryptData = useCallback((data: any, key: string): string => {
    // Simple XOR encryption - in production, use proper encryption
    const dataStr = JSON.stringify(data);
    const keyBytes = key.split('').map(char => char.charCodeAt(0));
    
    return dataStr
      .split('')
      .map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ keyBytes[index % keyBytes.length])
      )
      .join('');
  }, []);

  const decryptData = useCallback((encryptedData: string, key: string): any => {
    try {
      const keyBytes = key.split('').map(char => char.charCodeAt(0));
      
      const decrypted = encryptedData
        .split('')
        .map((char, index) => 
          String.fromCharCode(char.charCodeAt(0) ^ keyBytes[index % keyBytes.length])
        )
        .join('');
      
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }, []);

  // Security audit
  const performSecurityAudit = useCallback(() => {
    const audit = {
      timestamp: new Date().toISOString(),
      threatLevel,
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter(e => e.level === SecurityLevel.CRITICAL).length,
      highEvents: securityEvents.filter(e => e.level === SecurityLevel.HIGH).length,
      blockedIPs: blockedIPs.size,
      policiesEnabled: securityPolicies.filter(p => p.enabled).length,
      recommendations: generateSecurityRecommendations()
    };

    logSecurityEvent(
      ThreatType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.LOW,
      'Security audit performed',
      audit
    );

    return audit;
  }, [threatLevel, securityEvents, blockedIPs, securityPolicies]);

  const generateSecurityRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (threatLevel !== SecurityLevel.LOW) {
      recommendations.push('Consider enabling additional security measures');
    }
    
    if (securityEvents.filter(e => e.type === ThreatType.BRUTE_FORCE).length > 0) {
      recommendations.push('Implement stronger authentication mechanisms');
    }
    
    if (securityEvents.filter(e => e.type === ThreatType.XSS).length > 0) {
      recommendations.push('Review input validation and output encoding');
    }
    
    if (blockedIPs.size > 10) {
      recommendations.push('Consider implementing DDoS protection');
    }
    
    return recommendations;
  }, [threatLevel, securityEvents, blockedIPs]);

  // Helper functions
  const getCurrentUserId = (): string | undefined => {
    try {
      const session = localStorage.getItem('developer_session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.id;
      }
    } catch {
      // Ignore
    }
    return undefined;
  };

  const getCurrentSessionId = (): string | undefined => {
    return getCurrentUserId(); // Using user ID as session ID for simplicity
  };

  const getCurrentIP = (): string => {
    // In a real application, this would come from the server
    return 'client-ip';
  };

  return {
    // State
    securityEvents,
    securityPolicies,
    isSecurityEnabled,
    threatLevel,
    blockedIPs,
    
    // Core security methods
    validateInput,
    checkAccess,
    checkRateLimit,
    blockIP,
    isIPBlocked,
    
    // Data protection
    encryptData,
    decryptData,
    
    // Monitoring and audit
    logSecurityEvent,
    performSecurityAudit,
    
    // Configuration
    setIsSecurityEnabled,
    setSecurityPolicies,
    
    // Utilities
    getEventsByType: (type: ThreatType) => securityEvents.filter(e => e.type === type),
    getEventsByLevel: (level: SecurityLevel) => securityEvents.filter(e => e.level === level),
    getRecentEvents: (minutes: number = 60) => 
      securityEvents.filter(e => 
        Date.now() - new Date(e.timestamp).getTime() < minutes * 60 * 1000
      )
  };
};

export default useDeveloperSecurity;
