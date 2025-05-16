/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://uonnglzgwsoiqelnxfxc.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbm5nbHpnd3NvaXFlbG54ZnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODQzOTEsImV4cCI6MjA2Mjc2MDM5MX0.AvYdtw51WuzFbk_sGN8FNwmAebTWwVAqCbMc7cApokQ',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: '135152694575-rtft848b2k1v1a67r7r5a77bbmofnbc0.apps.googleusercontent.com',
    NEXT_PUBLIC_FACEBOOK_CLIENT_ID: 'Revd007s Project'
  }
};

module.exports = nextConfig;