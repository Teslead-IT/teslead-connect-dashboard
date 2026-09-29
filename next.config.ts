import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['http://localhost:3042', 'http://10.131.159.226:3042', 'http://localhost:3021', 'http://localhost:3022', 'http://192.168.1.136:3042','192.168.1.136'],
};

export default nextConfig;
