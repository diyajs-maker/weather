import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        pathname: '/img/wn/**',
      },
    ],
  },
  // Avoid Turbopack bundling pdfkit/fontkit (incompatible with @swc/helpers ESM)
  serverExternalPackages: ['pdfkit', 'fontkit'],
};

export default nextConfig;
