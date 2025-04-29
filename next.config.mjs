/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        "xdymta7eafcscakr.public.blob.vercel-storage.com",
      ],
    },

    webpack(config) {
        // Shunt the @solana-mobile wallet‐adapter out of the bundle
        config.resolve.alias = {
          ...config.resolve.alias,
          '@solana-mobile/wallet-adapter-mobile': false,
        };
        return config;
    },
};

export default nextConfig;
