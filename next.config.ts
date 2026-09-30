import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Next `dev` = 3041, `start` = 3042 — allow LAN + localhost for both
  allowedDevOrigins: [
    'localhost:3041',
    'localhost:3042',
    '192.168.1.196:3041',
    '192.168.1.196:3042',
    '10.131.159.226:3041',
    '10.131.159.226:3042',
  ],
};

export default nextConfig;
