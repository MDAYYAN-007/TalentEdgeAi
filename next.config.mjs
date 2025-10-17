/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000', '.devtunnels.ms']
        }
    }
};

export default nextConfig;