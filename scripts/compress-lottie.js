const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const lottieDir = path.join(__dirname, '..', 'public', 'lottie');

// Helper to round numbers to 2 decimal places to save massive bytes while preserving visual fidelity
function optimizeNumbers(obj) {
  if (typeof obj === 'number') {
    if (Number.isInteger(obj)) return obj;
    // Round to 2 decimal places
    return Math.round(obj * 100) / 100;
  }
  if (Array.isArray(obj)) {
    return obj.map(optimizeNumbers);
  }
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      // Remove harmless metadata that increases size
      if (key === 'nm' && typeof obj[key] === 'string' && obj[key].length > 30) {
        // truncate long debug layer names
        res[key] = obj[key].slice(0, 12);
      } else {
        res[key] = optimizeNumbers(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

// Helper to compress base64 images inside assets
async function optimizeAssets(assets) {
  if (!assets || !Array.isArray(assets)) return assets;
  const optimized = [];
  for (const asset of assets) {
    if (asset.p && typeof asset.p === 'string' && asset.p.startsWith('data:image/')) {
      try {
        const matches = asset.p.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const imgBuffer = Buffer.from(matches[2], 'base64');
          // Resize & compress image buffer using sharp WebP or compressed PNG
          const compressedBuffer = await sharp(imgBuffer)
            .webp({ quality: 75, effort: 6 })
            .toBuffer();
          
          const newBase64 = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
          if (newBase64.length < asset.p.length) {
            optimized.push({
              ...asset,
              p: newBase64,
              u: '',
              e: 1
            });
            continue;
          }
        }
      } catch (e) {
        console.warn('Could not compress asset:', asset.id, e.message);
      }
    }
    optimized.push(asset);
  }
  return optimized;
}

async function run() {
  const files = fs.readdirSync(lottieDir);
  console.log('Starting Lottie compression...\n');
  
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(lottieDir, file);
    const origContent = fs.readFileSync(filePath, 'utf8');
    const origSize = Buffer.byteLength(origContent, 'utf8');
    totalBefore += origSize;

    try {
      let data = JSON.parse(origContent);

      // 1. Optimize embedded images if any
      if (data.assets && data.assets.length > 0) {
        data.assets = await optimizeAssets(data.assets);
      }

      // 2. Optimize floats and numbers
      data = optimizeNumbers(data);

      // 3. Minified JSON
      const minified = JSON.stringify(data);
      const newSize = Buffer.byteLength(minified, 'utf8');
      totalAfter += newSize;

      fs.writeFileSync(filePath, minified, 'utf8');

      const savedPercent = (((origSize - newSize) / origSize) * 100).toFixed(1);
      console.log(
        `✓ ${file.padEnd(25)}: ${(origSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${savedPercent}% saved)`
      );
    } catch (err) {
      console.error(`✗ Failed to process ${file}:`, err.message);
      totalAfter += origSize;
    }
  }

  const totalSavedPercent = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Total Before: ${(totalBefore / 1024).toFixed(1)} KB`);
  console.log(`Total After : ${(totalAfter / 1024).toFixed(1)} KB`);
  console.log(`Total Saved : ${( (totalBefore - totalAfter) / 1024).toFixed(1)} KB (${totalSavedPercent}%)`);
  console.log(`========================================\n`);
}

run();
