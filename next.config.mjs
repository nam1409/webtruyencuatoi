const getSupabaseHostname = () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : 'lhectrdygxpbukdcavnq.supabase.co';
  } catch {
    return 'lhectrdygxpbukdcavnq.supabase.co';
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname(),
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
