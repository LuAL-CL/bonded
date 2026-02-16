/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bonded/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
