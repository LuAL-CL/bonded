/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bonded/shared"],
  // Keep native addons out of the webpack bundle (sharp, ioredis, etc.)
  serverExternalPackages: ["sharp", "ioredis", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
