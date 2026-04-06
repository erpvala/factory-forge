// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Key, 
  Globe, 
  Monitor,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Zap,
  Database,
  GitBranch
} from 'lucide-react';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    username: string;
    avatar?: string;
    bio: string;
    location: string;
    website: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
    mentions: boolean;
    assignments: boolean;
    deployments: boolean;
    errors: boolean;
  };
  security: {
    twoFactor: boolean;
    apiKeys: Array<{
      id: string;
      name: string;
      key: string;
      createdAt: string;
      lastUsed: string;
    }>;
    sessions: Array<{
      id: string;
      device: string;
      ip: string;
      lastActive: string;
    }>;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    defaultBranch: string;
    autoMerge: boolean;
  };
}

const DeveloperSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const demoSettings: UserSettings = {
      profile: {
        name: 'John Developer',
        email: 'john@company.com',
        username: 'johndeveloper',
        bio: 'Full-stack developer passionate about DevOps and automation',
        location: 'San Francisco, CA',
        website: 'https://johndeveloper.dev'
      },
      notifications: {
        email: true,
        push: true,
        slack: false,
        mentions: true,
        assignments: true,
        deployments: true,
        errors: true
      },
      security: {
        twoFactor: true,
        apiKeys: [
          {
            id: 'key_1',
            name: 'Production API Key',
            key: 'sk_live_51H2...8f9g',
            createdAt: '3 months ago',
            lastUsed: '2 hours ago'
          },
          {
            id: 'key_2',
            name: 'Development API Key',
            key: 'sk_test_51H2...3a4b',
            createdAt: '1 month ago',
            lastUsed: '1 day ago'
          }
        ],
        sessions: [
          {
            id: 'session_1',
            device: 'Chrome on macOS',
            ip: '192.168.1.100',
            lastActive: '2 minutes ago'
          },
          {
            id: 'session_2',
            device: 'Mobile App',
            ip: '10.0.0.15',
            lastActive: '1 hour ago'
          }
        ]
      },
      preferences: {
        theme: 'system',
        language: 'English',
        timezone: 'UTC-8 (PST)',
        dateFormat: 'MM/DD/YYYY',
        defaultBranch: 'main',
        autoMerge: false
      }
    };

    setTimeout(() => {
      setSettings(demoSettings);
      setLoading(false);
    }, 800);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save operation
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Monitor }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your developer account settings</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="flex space-x-1 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className="flex items-center space-x-2"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={settings.profile.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={settings.profile.username}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, username: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    profile: { ...settings.profile, email: e.target.value }
                  })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Input
                  value={settings.profile.bio}
                  onChange={(e) => setSettings({
                    ...settings,
                    profile: { ...settings.profile, bio: e.target.value }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={settings.profile.location}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, location: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={settings.profile.website}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, website: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notification Channels</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="capitalize">{key}</span>
                        <Button
                          variant={value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [key]: !value
                            }
                          })}
                        >
                          {value ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Types</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications).slice(3).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="capitalize">{key}</span>
                        <Button
                          variant={value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [key]: !value
                            }
                          })}
                        >
                          {value ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {settings.security.twoFactor ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">2FA is {settings.security.twoFactor ? 'enabled' : 'disabled'}</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    {settings.security.twoFactor ? 'Disable' : 'Enable'} 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {settings.security.apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{apiKey.key}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {apiKey.createdAt} • Last used {apiKey.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New API Key
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {settings.security.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-muted-foreground">IP: {session.ip}</p>
                        <p className="text-xs text-muted-foreground">Last active: {session.lastActive}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle>Developer Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={settings.preferences.theme}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        theme: e.target.value as 'light' | 'dark' | 'system'
                      }
                    })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Input
                    value={settings.preferences.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        language: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <Input
                    value={settings.preferences.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        timezone: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date Format</label>
                  <Input
                    value={settings.preferences.dateFormat}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: {
                        ...settings.preferences,
                        dateFormat: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <GitBranch className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Default Branch</p>
                    <p className="text-sm text-muted-foreground">
                      Set the default branch for new repositories
                    </p>
                  </div>
                </div>
                <Input
                  className="w-32"
                  value={settings.preferences.defaultBranch}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      defaultBranch: e.target.value
                    }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Auto-merge Pull Requests</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically merge PRs when all checks pass
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.preferences.autoMerge ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      autoMerge: !settings.preferences.autoMerge
                    }
                  })}
                >
                  {settings.preferences.autoMerge ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeveloperSettingsPage;
