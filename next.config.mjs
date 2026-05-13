/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'w-board-six.vercel.app',
        '*.vercel.app',
      ],
    },
  },
  typescript: {
    ignoreBuildErrors: false, // Changed to false to catch real errors
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
