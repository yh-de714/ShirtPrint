/** @type {import('next').NextConfig} */
	
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    // Add a fallback for the canvas module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false
    };
    return config;
  }
}

module.exports = nextConfig;