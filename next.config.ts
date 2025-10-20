import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    domains: ["res.cloudinary.com"], // allow cloudinary
     // Increase timeout to 30 seconds
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", 
  },  
  // Increase overall timeout
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime'],
  },
  staticPageGenerationTimeout: 120,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
