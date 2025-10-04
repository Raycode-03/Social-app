import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    domains: ["res.cloudinary.com"], // allow cloudinary
  },  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
