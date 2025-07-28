#!/usr/bin/env node

// Check environment variables during build
console.log('🔍 Checking environment variables during build...');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NUXT_PUBLIC_API_BASE:', process.env.NUXT_PUBLIC_API_BASE);
console.log('BASE_URL:', process.env.BASE_URL);

// Check if the API base is set correctly
if (process.env.NUXT_PUBLIC_API_BASE) {
  console.log('✅ NUXT_PUBLIC_API_BASE is set to:', process.env.NUXT_PUBLIC_API_BASE);
} else {
  console.log('❌ NUXT_PUBLIC_API_BASE is not set, will use default: http://localhost:8000/api');
}

console.log('📋 All environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('NUXT') || key.includes('API') || key.includes('BASE'))
  .forEach(key => {
    console.log(`  ${key}: ${process.env[key]}`);
  }); 