/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    VENICE_API_KEY: process.env.VENICE_API_KEY,
  },
};

console.log('Next.js Config Environment:', {
  hasMongoDB: !!process.env.MONGODB_URI,
  mongoUri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
});

module.exports = nextConfig; 