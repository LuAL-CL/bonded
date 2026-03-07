/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bonded/shared", "@bonded/render-worker"],
  experimental: {
    // Keep native addons out of the webpack bundle (sharp, ioredis, etc.)
    // Next.js 14 uses serverComponentsExternalPackages (renamed in v15)
    serverComponentsExternalPackages: ["sharp", "ioredis", "@prisma/client"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
