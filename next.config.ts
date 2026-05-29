import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'msedge-tts', 'pdfkit'],
};

export default nextConfig;
