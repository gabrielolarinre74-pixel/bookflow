import type { NextConfig } from "next";

// Static export: the whole app runs in the browser, so it can be hosted on
// GitHub Pages, Netlify, S3 or any static host. Set NEXT_PUBLIC_BASE_PATH
// (e.g. "/bookflow") when serving from a sub-path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
	output: "export",
	reactStrictMode: true,
	trailingSlash: true,
	images: { unoptimized: true },
	basePath,
	assetPrefix: basePath || undefined,
};

export default nextConfig;
