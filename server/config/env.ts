import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  APP_URL: process.env.APP_URL || 'https://modelverseindia.com',
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_64_character_random_string_for_local_testing_only',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'default_cookie_secret_64_character_random_string_for_local_testing_only',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_API_KEY || '',
  PREMIUM_UNLOCK_AMOUNT: Number(process.env.PREMIUM_UNLOCK_AMOUNT || process.env.VITE_PREMIUM_UNLOCK_AMOUNT || '299')
};
