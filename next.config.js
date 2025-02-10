/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    VENICE_API_KEY: process.env.VENICE_API_KEY,
    NBA_API_KEY: process.env.NBA_API_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  images: {
    domains: ['upload.wikimedia.org'],
  },
};

console.log('Next.js Config Environment:', {
  hasMongoDB: !!process.env.MONGODB_URI,
  mongoUri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
});

require('dotenv').config();

module.exports = nextConfig; 