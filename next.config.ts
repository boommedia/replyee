import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow PDF parsing in API routes
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
