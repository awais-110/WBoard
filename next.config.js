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
}

// Prevent server webpack from attempting to bundle the native `canvas` module
// (used transitively by some packages). This ensures server builds don't fail
// on Windows when native binaries aren't available.
nextConfig.webpack = (config, { isServer }) => {
  if (isServer) {
    config.externals = config.externals || []
    config.externals.push('canvas')
  }
  return config
}

module.exports = nextConfig
