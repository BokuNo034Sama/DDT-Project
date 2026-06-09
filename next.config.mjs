/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^\/(?:dashboard|projects)(?:\/.*)?$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "desktop-routes-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "desktop-static-assets-cache",
      },
    },
  ],
})({
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
});

export default nextConfig;
