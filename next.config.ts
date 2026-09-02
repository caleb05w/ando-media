import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The homepage renders every route as a live iframe thumbnail; the dev-tools
  // button would otherwise sit in the corner of every canvas.
  devIndicators: false,
};

export default nextConfig;
