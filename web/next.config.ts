import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // tambahkan via.placeholder.com kalau masih pakai data dummy
      {
        protocol: "https",
        hostname: "www.shutterstock.com",
      },
    ],
  },
};

export default nextConfig;
