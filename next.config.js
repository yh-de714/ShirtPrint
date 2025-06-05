/** @type {import('next').NextConfig} */
	
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false, // prevent bundling `canvas` on client
      };
    }
    return config;
  },
}
module.exports = nextConfig; 

