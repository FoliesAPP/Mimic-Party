/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    // Deterministic chunk IDs prevent the "Cannot find module './NNN.js'" race
    // condition that appears on Windows with Next.js 14 SSG workers.
    config.optimization.chunkIds = "deterministic";
    config.optimization.moduleIds = "deterministic";

    // Keep all server-side game code in a single chunk so workers never look
    
    // for a split-off chunk that hasn't been flushed to disk yet.
    if (isServer) {
      config.optimization.splitChunks = false;
    }

    return config;
  },
};

export default nextConfig;
