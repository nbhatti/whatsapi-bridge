/** @type {import('next').NextConfig} */
const { createSecureHeaders } = require('next-secure-headers');

const nextConfig = {
  // Font optimization to prevent unused preload warnings
  optimizeFonts: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...createSecureHeaders({
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:", "https://chart.googleapis.com"],
                mediaSrc: ["'self'", "data:", "blob:"],
                connectSrc: [
                  "'self'",
                  "http://localhost:3000",
                  "ws://localhost:3000",
                  "http://localhost:4000",
                  "ws://localhost:4000",
                  process.env.BACKEND_URL || "http://localhost:3000",
                ],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production',
              },
            },
            referrerPolicy: 'strict-origin-when-cross-origin',
            permissionsPolicy: {
              camera: [],
              microphone: [],
              geolocation: [],
            },
          }),
        ],
      },
      {
        // CORS headers for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Optional: Proxy API calls to backend if needed
      {
        source: '/backend-api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
