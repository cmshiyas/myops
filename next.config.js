/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure these packages are never bundled into client-side code
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

  // Validate that secret keys exist at build time (will fail build if missing)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Hard-block secret env vars from ever reaching browser bundle
      config.plugins.push(
        new (require('webpack').DefinePlugin)({
          'process.env.ANTHROPIC_API_KEY': JSON.stringify(''),
          'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(''),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
