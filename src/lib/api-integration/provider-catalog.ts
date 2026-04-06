// @ts-nocheck

export type IntegrationCategory =
  | 'payment'
  | 'email'
  | 'sms_otp'
  | 'storage'
  | 'push'
  | 'map_geo'
  | 'analytics'
  | 'oauth'
  | 'hosting';

export interface ProviderKeyField {
  key: string;
  label: string;
  placeholder: string;
}

export interface ProviderTemplate {
  providerId: string;
  providerName: string;
  category: IntegrationCategory;
  description: string;
  optional?: boolean;
  keyFields: ProviderKeyField[];
}

export const PROVIDER_CATALOG: ProviderTemplate[] = [
  {
    providerId: 'razorpay',
    providerName: 'Razorpay API',
    category: 'payment',
    description: 'Payment gateway for checkout, invoices, and recurring billing.',
    keyFields: [
      { key: 'api_key', label: 'API Key', placeholder: 'rzp_live_xxxxx' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'secret_xxxxx' },
    ],
  },
  {
    providerId: 'stripe',
    providerName: 'Stripe API',
    category: 'payment',
    description: 'Global payments, subscriptions, and webhook orchestration.',
    keyFields: [
      { key: 'api_key', label: 'API Key', placeholder: 'pk_live_xxxxx' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_xxxxx' },
    ],
  },
  {
    providerId: 'sendgrid',
    providerName: 'SendGrid API',
    category: 'email',
    description: 'Transactional email delivery and deliverability analytics.',
    keyFields: [{ key: 'api_key', label: 'API Key', placeholder: 'SG.xxxxx' }],
  },
  {
    providerId: 'aws-ses',
    providerName: 'AWS SES',
    category: 'email',
    description: 'AWS-based email delivery for bulk and transactional messaging.',
    keyFields: [{ key: 'api_key', label: 'API Key', placeholder: 'ses_key_xxxxx' }],
  },
  {
    providerId: 'twilio',
    providerName: 'Twilio API',
    category: 'sms_otp',
    description: 'SMS, OTP, and voice verification flows.',
    keyFields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'ACxxxxxxxxxx' },
      { key: 'auth_token', label: 'Auth Token', placeholder: 'token_xxxxx' },
    ],
  },
  {
    providerId: 'msg91',
    providerName: 'MSG91',
    category: 'sms_otp',
    description: 'OTP and regional SMS delivery pipeline.',
    keyFields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'msg91_sid_xxxxx' },
      { key: 'auth_token', label: 'Auth Token', placeholder: 'msg91_token_xxxxx' },
    ],
  },
  {
    providerId: 'aws-s3',
    providerName: 'AWS S3',
    category: 'storage',
    description: 'Object storage for uploads, exports, and media.',
    keyFields: [
      { key: 'access_key', label: 'Access Key', placeholder: 'AKIAxxxxx' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'secret_xxxxx' },
    ],
  },
  {
    providerId: 'cloudinary',
    providerName: 'Cloudinary',
    category: 'storage',
    description: 'Media storage, transformations, and CDN delivery.',
    keyFields: [
      { key: 'access_key', label: 'Access Key', placeholder: 'cloud_name_or_key' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'secret_xxxxx' },
    ],
  },
  {
    providerId: 'firebase-fcm',
    providerName: 'Firebase FCM',
    category: 'push',
    description: 'Push notifications for web and mobile clients.',
    keyFields: [{ key: 'server_key', label: 'Server Key', placeholder: 'fcm_server_key_xxxxx' }],
  },
  {
    providerId: 'google-maps',
    providerName: 'Google Maps API',
    category: 'map_geo',
    description: 'Maps, autocomplete, routes, and geo services.',
    keyFields: [{ key: 'api_key', label: 'API Key', placeholder: 'maps_key_xxxxx' }],
  },
  {
    providerId: 'google-analytics',
    providerName: 'Google Analytics',
    category: 'analytics',
    description: 'Traffic analytics, funnels, and attribution.',
    keyFields: [{ key: 'tracking_id', label: 'Tracking ID', placeholder: 'G-XXXXXXX' }],
  },
  {
    providerId: 'mixpanel',
    providerName: 'Mixpanel',
    category: 'analytics',
    description: 'Event analytics, funnels, and retention monitoring.',
    keyFields: [{ key: 'tracking_id', label: 'Tracking ID', placeholder: 'mixpanel_project_token' }],
  },
  {
    providerId: 'google-login',
    providerName: 'Google Login',
    category: 'oauth',
    description: 'Google OAuth client setup for login and consent.',
    optional: true,
    keyFields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'google_client_id' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'google_client_secret' },
    ],
  },
  {
    providerId: 'facebook-login',
    providerName: 'Facebook Login',
    category: 'oauth',
    description: 'Facebook OAuth client setup for social login.',
    optional: true,
    keyFields: [
      { key: 'client_id', label: 'Client ID', placeholder: 'facebook_client_id' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'facebook_client_secret' },
    ],
  },
  {
    providerId: 'cloudflare',
    providerName: 'Cloudflare API',
    category: 'hosting',
    description: 'DNS, CDN, WAF, and edge-cache controls.',
    optional: true,
    keyFields: [{ key: 'token', label: 'Token', placeholder: 'cloudflare_token' }],
  },
  {
    providerId: 'vercel',
    providerName: 'Vercel API',
    category: 'hosting',
    description: 'Deployments, env vars, and preview management.',
    optional: true,
    keyFields: [{ key: 'token', label: 'Token', placeholder: 'vercel_token' }],
  },
];

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  payment: 'Payment',
  email: 'Email',
  sms_otp: 'SMS / OTP',
  storage: 'Storage',
  push: 'Push Notification',
  map_geo: 'Map / Geo',
  analytics: 'Analytics',
  oauth: 'OAuth',
  hosting: 'Hosting / CDN',
};

export function findProvider(providerId: string) {
  return PROVIDER_CATALOG.find((provider) => provider.providerId === providerId) ?? null;
}
