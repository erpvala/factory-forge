/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/control-panel',
  
  // Layer 1: Build ID Rotation - Force fresh deployment
  generateBuildId: async () => {
    return Date.now().toString();
  },

  // Caching policy
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'X-Build-ID',
            value: Date.now().toString(),
          },
        ],
      },
    ];
  },

  // Layer 2: Server-Enforced Allowlist
  redirects: async () => {
    return [
      // Block legacy paths → /login
      {
        source: '/user/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/super-admin/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/boss/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/franchise/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/influencer/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/dashboard/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/old/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/dev/:path*',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/staging/:path*',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
