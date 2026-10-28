import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hostnames only (no protocol/port) — Next compares Origin hostname against this list
  allowedDevOrigins: [
    '192.168.1.203',
    '10.131.159.226',
  ],
};

export default nextConfig;
