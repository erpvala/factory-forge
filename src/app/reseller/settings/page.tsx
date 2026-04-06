// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useResellerDashboardAuth } from '@/hooks/useResellerDashboardAuth';
import { useResellerDashboardState } from '@/hooks/useResellerDashboardState';

const ResellerSettingsPage: React.FC = () => {
  const { user, isAuthenticated, updateProfile } = useResellerDashboardAuth();
  const { state, refreshData } = useResellerDashboardState();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    country: '',
    website: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newSaleAlerts: true,
    supportAlerts: true,
    systemAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: true,
    ipWhitelist: false,
    loginAlerts: true
  });

  const [paymentSettings, setPaymentSettings] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    ifscCode: '',
    payoutMethod: 'bank'
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        website: user.website || ''
      });
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your settings.</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profileData);
      // Show success message
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      // Update password logic
      console.log('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Save notification settings
      console.log('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      // Save security settings
      console.log('Security settings saved');
    } catch (error) {
      console.error('Error saving security settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      // Save payment settings
      console.log('Payment settings saved');
    } catch (error) {
      console.error('Error saving payment settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    placeholder="Enter your company name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    placeholder="Enter your address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={profileData.city}
                    onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input
                    value={profileData.country}
                    onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                    placeholder="Enter your country"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    placeholder="Enter your website URL"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-8"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="relative">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button onClick={handleSavePassword} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Sale Alerts</h4>
                      <p className="text-sm text-muted-foreground">Get notified when you make a sale</p>
                    </div>
                    <Switch
                      checked={notificationSettings.newSaleAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newSaleAlerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Support Alerts</h4>
                      <p className="text-sm text-muted-foreground">Get notified about new support tickets</p>
                    </div>
                    <Switch
                      checked={notificationSettings.supportAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, supportAlerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">System Alerts</h4>
                      <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notifications'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <Switch
                    checked={securitySettings.sessionTimeout}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, sessionTimeout: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">IP Whitelist</h4>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelist}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, ipWhitelist: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Login Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginAlerts: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSecurity} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Manage your payout preferences and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <Input
                    value={paymentSettings.bankName}
                    onChange={(e) => setPaymentSettings({...paymentSettings, bankName: e.target.value})}
                    placeholder="Enter your bank name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Number</label>
                  <Input
                    value={paymentSettings.accountNumber}
                    onChange={(e) => setPaymentSettings({...paymentSettings, accountNumber: e.target.value})}
                    placeholder="Enter your account number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Name</label>
                  <Input
                    value={paymentSettings.accountName}
                    onChange={(e) => setPaymentSettings({...paymentSettings, accountName: e.target.value})}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">IFSC Code</label>
                  <Input
                    value={paymentSettings.ifscCode}
                    onChange={(e) => setPaymentSettings({...paymentSettings, ifscCode: e.target.value})}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Payout Method</label>
                <select 
                  value={paymentSettings.payoutMethod}
                  onChange={(e) => setPaymentSettings({...paymentSettings, payoutMethod: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>

              <Button onClick={handleSavePayment} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>General application preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Additional general settings can be configured here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResellerSettingsPage;
