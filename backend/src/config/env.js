const dotenv = require('dotenv');
const path = require('path');

// Ensure .env is loaded from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5001,
  TZ: process.env.TZ || 'Asia/Kolkata',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/chiefnet',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'chiefnet_super_secret_access_jwt_key_2026_xyz',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'chiefnet_super_secret_refresh_jwt_key_2026_xyz',
  QR_SECRET: process.env.QR_SECRET || 'chiefnet_super_secret_qr_signature_key_2026_xyz',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 2525,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@chiefnet.com',
  ADMIN_NAME: process.env.ADMIN_NAME || 'ChiefNet System Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@chiefnet.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123#Secure'
};

// Set Node process timezone
process.env.TZ = env.TZ;

module.exports = env;
