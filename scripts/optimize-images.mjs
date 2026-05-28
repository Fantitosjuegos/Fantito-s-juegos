import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const assetsDir = './src/assets';

const files = await readdir(assetsDir);
const pngFiles = files.filter(f => f.endsWith('.png'));

console.log(`Found ${pngFiles.length} PNG files to optimize...`);

for (const file of pngFiles) {
  const inputPath = join(assetsDir, file);
  const outputPath = join(assetsDir, file.replace('.png', '.webp'));
  
  const info = await sharp(inputPath)
    .webp({ quality: 85 })
    .toFile(outputPath);
  
  console.log(`✓ ${file} → ${file.replace('.png', '.webp')} (${Math.round(info.size / 1024)}KB)`);
}

console.log('Done! Update your imports to use .webp files.');