import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Local production tests point the API at a running uvicorn; on Vercel the Python function is at /api/.
const apiOrigin = process.env.FISHY_API_ORIGIN ?? (isDev ? "http://127.0.0.1:8000" : "");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Test builds use their own folder so they never overwrite a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/py/:path*",
        destination: apiOrigin ? `${apiOrigin}/api/py/:path*` : "/api/",
      },
    ];
  },
};

export default nextConfig;
