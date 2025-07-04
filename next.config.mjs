/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Build sırasında ESLint hatalarını ignore et
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;