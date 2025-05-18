/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://uonnglzgwsoiqelnxfxc.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbm5nbHpnd3NvaXFlbG54ZnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODQzOTEsImV4cCI6MjA2Mjc2MDM5MX0.AvYdtw51WuzFbk_sGN8FNwmAebTWwVAqCbMc7cApokQ',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '135152694575-rtft848b2k1v1a67r7r5a77bbmofnbc0.apps.googleusercontent.com',
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID: 'Revd007s Project'
  },
  webpack: (config, { isServer }) => {
    // Mengabaikan modul-modul driver database yang tidak digunakan oleh Knex.js
    // Ini mencegah error "Module not found" saat build jika driver tersebut tidak diinstal.
    config.externals = [
      ...(config.externals || []),
      'pg-native',
      'sqlite3',
      'tedious',
      'better-sqlite3',
      'oracledb',
      'mysql',
      'mysql2',
      'pg-query-stream',
      // tambahkan driver lain yang tidak Anda gunakan jika perlu
    ];
    return config;
  },
};

export default nextConfig;