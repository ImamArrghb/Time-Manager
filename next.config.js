/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false // PWA mati saat dev mode biar gak nyache
  });
  
  const nextConfig = {
    // Config lainnya (jika ada)
  };
  
  module.exports = withPWA(nextConfig);