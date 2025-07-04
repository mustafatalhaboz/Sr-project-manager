/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Build sırasında ESLint hatalarını yoksay
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Build sırasında TypeScript hatalarını yoksay (opsiyonel)
    ignoreBuildErrors: false,
  },
}

export default nextConfig