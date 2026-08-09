const isGithubActions = process.env.GITHUB_ACTIONS || false;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable X-Powered-By header
  poweredByHeader: false,

  // Fast single-render mode for maximum responsiveness
  reactStrictMode: false,

  // GitHub Pages Static Export Config
  output: isGithubActions ? 'export' : undefined,
  basePath: isGithubActions ? '/AI_INSTITUTE' : '',
  assetPrefix: isGithubActions ? '/AI_INSTITUTE/' : '',

  // Unoptimized images for instant rendering without dedicated image server overhead
  images: {
    unoptimized: true,
  },

  // Enterprise Security & Caching Headers (active for SSR Node environments)
  ...(isGithubActions ? {} : {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'geolocation=(), camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si")',
            },
          ],
        },
        {
          source: '/uploads/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
