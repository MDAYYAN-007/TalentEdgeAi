/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000', '.devtunnels.ms']
        }
    },
    eslint: {
        ignoreDuringBuilds: true, // Add this line
    },
    typescript: {
        ignoreBuildErrors: true, // Add this line
    },
};

export default nextConfig;