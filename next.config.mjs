const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];
const config = {
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};
export default config;
