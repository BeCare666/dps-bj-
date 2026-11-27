import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads par Server Action (image de formation, document d'évaluation
  // externe) : 1 Mo par défaut ; Vercel plafonne le corps à 4,5 Mo.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dg9fitya/**",
      },
    ],
  },
};

export default nextConfig;
