import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/rest\/v1\/flights.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "flight-search",
        expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff2|png|jpg|jpeg|svg|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
