import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  console.log('☁️ Testing Cloudinary connection...');
  try {
    // Small transparent pixel as base64
    const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const result = await cloudinary.uploader.upload(testBase64, {
      folder: 'rentnowpk/test',
    });
    console.log('✅ Cloudinary Upload Success!');
    console.log('🔗 URL:', result.secure_url);
  } catch (err) {
    console.error('❌ Cloudinary Error:', err.message);
    if (err.http_code) console.error('HTTP Code:', err.http_code);
  }
}

test();
