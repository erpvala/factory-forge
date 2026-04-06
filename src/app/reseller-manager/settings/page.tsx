// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useResellerManagerState } from '@/hooks/useResellerManagerState';
import { useResellerManagerAuth } from '@/hooks/useResellerManagerAuth';

const ResellerManagerSettingsPage: React.FC = () => {
  const { state, dispatch } = useResellerManagerState();
  const { auth, canAccessFeature } = useResellerManagerAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Reseller Manager System',
    companyEmail: 'admin@resellermanager.com',
    supportPhone: '+1-800-RESELLER',
    timezone: 'UTC',
    language: 'en',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowBalanceAlerts: true,
    newResellerAlerts: true,
    commissionAlerts: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipWhitelist: false,
    auditLogging: true,
    
    // Payment Settings
    defaultCommissionRate: 20,
    minimumPayoutAmount: 100,
    payoutFrequency: 'monthly',
    paymentMethods: ['bank_transfer', 'paypal'],
    
    // System Settings
    autoLicenseGeneration: true,
    licenseExpiryDays: 365,
    maxResellersPerTier: 100,
    enableDemoMode: true,
  });

  const handleSaveSettings = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saving ${section} settings:`, settings);
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!canAccessFeature('reseller_control')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your reseller manager system preferences
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          System Online
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic system information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full p-2 border rounded-md"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                    <option value="IST">IST</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('general')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive SMS alerts for critical events</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Balance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when reseller balance is low</p>
                  </div>
                  <Switch
                    checked={settings.lowBalanceAlerts}
                    onCheckedChange={(checked) => handleSettingChange('lowBalanceAlerts', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Reseller Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify when new resellers register</p>
                  </div>
                  <Switch
                    checked={settings.newResellerAlerts}
                    onCheckedChange={(checked) => handleSettingChange('newResellerAlerts', checked)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notifications')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch
                    checked={settings.ipWhitelist}
                    onCheckedChange={(checked) => handleSettingChange('ipWhitelist', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all administrative actions</p>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('security')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure commission rates and payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
                  <Input
                    id="defaultCommissionRate"
                    type="number"
                    value={settings.defaultCommissionRate}
                    onChange={(e) => handleSettingChange('defaultCommissionRate', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayoutAmount">Minimum Payout Amount</Label>
                  <Input
                    id="minimumPayoutAmount"
                    type="number"
                    value={settings.minimumPayoutAmount}
                    onChange={(e) => handleSettingChange('minimumPayoutAmount', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payoutFrequency">Payout Frequency</Label>
                <select
                  id="payoutFrequency"
                  className="w-full p-2 border rounded-md"
                  value={settings.payoutFrequency}
                  onChange={(e) => handleSettingChange('payoutFrequency', e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('payments')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system behavior and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto License Generation</Label>
                    <p className="text-sm text-muted-foreground">Automatically generate licenses on sales</p>
                  </div>
                  <Switch
                    checked={settings.autoLicenseGeneration}
                    onCheckedChange={(checked) => handleSettingChange('autoLicenseGeneration', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Demo Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable demo mode for testing</p>
                  </div>
                  <Switch
                    checked={settings.enableDemoMode}
                    onCheckedChange={(checked) => handleSettingChange('enableDemoMode', checked)}
                  />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiryDays">License Expiry (days)</Label>
                    <Input
                      id="licenseExpiryDays"
                      type="number"
                      value={settings.licenseExpiryDays}
                      onChange={(e) => handleSettingChange('licenseExpiryDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxResellersPerTier">Max Resellers Per Tier</Label>
                    <Input
                      id="maxResellersPerTier"
                      type="number"
                      value={settings.maxResellersPerTier}
                      onChange={(e) => handleSettingChange('maxResellersPerTier', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('system')} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResellerManagerSettingsPage;
