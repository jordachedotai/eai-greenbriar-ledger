import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No dev badge in screenshots or the room.
  devIndicators: false,
  // NEXT_DIST_DIR=.next-build npm run build: a production build beside a
  // running dev server, which shares .next otherwise. Unset on Vercel.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      { source: "/portcos", destination: "/portfolio", permanent: false },
      { source: "/portcos/:id", destination: "/portfolio/:id", permanent: false },
    ];
  },
  env: {
    // Exposed to the client so the default mode matches .env.local.
    MOCK_MODE: process.env.MOCK_MODE ?? "true",
  },
};

export default nextConfig;
