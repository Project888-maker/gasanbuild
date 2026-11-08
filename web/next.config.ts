import type { NextConfig } from "next";

// Sputnik Delivery Ltd's own domain shows only the driver pages.
const SPUTNIK_HOST = [{ type: "host" as const, value: "(www\\.)?sputnikdelivery\\.co\\.uk" }];

const config: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: SPUTNIK_HOST, destination: "/sputnik" },
        { source: "/admin", has: SPUTNIK_HOST, destination: "/sputnik/admin" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        // Anything else on Sputnik's domain (the portfolio pages) goes to the driver page.
        source: "/:path((?!sputnik|api/sputnik|_next|admin$|favicon|robots).+)",
        has: SPUTNIK_HOST,
        destination: "/",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/media/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
