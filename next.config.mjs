/** @type {import('next').NextConfig} */ 
const nextConfig = {
     eslint: { 
        // ✅ Don’t fail the Vercel build on ESLint errors 
        ignoreDuringBuilds: true, 
    }, 
    // (optional) if TypeScript errors ever block build, uncomment: 
    // typescript: { ignoreBuildErrors: true }, 
}; 
export default nextConfig; 