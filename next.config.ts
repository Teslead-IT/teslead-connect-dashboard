import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['http://localhost:3042', 'http://10.131.159.226:3042', 'http://localhost:3021', 'http://localhost:3022'],
};

export default nextConfig;
