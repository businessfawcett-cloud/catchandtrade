const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function createIcon(size, text, outputFile) {
  const escapedText = text.replace(/&/g, '&amp;');
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#DC2626"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.35}px" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${escapedText}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputFile);

  console.log(`Created: ${outputFile}`);
}

async function createSplash() {
  const width = 1284;
  const height = 2778;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#DC2626"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="80" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >Catch and Trade</text>
    </svg>
  `;

  const outputFile = path.join(assetsDir, 'splash.png');
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputFile);

  console.log(`Created: ${outputFile}`);
}

async function main() {
  await createIcon(1024, 'C&T', path.join(assetsDir, 'icon.png'));
  await createIcon(1024, 'C&T', path.join(assetsDir, 'adaptive-icon.png'));
  await createSplash();
  await createIcon(48, 'C', path.join(assetsDir, 'favicon.png'));
  console.log('All icons generated!');
}

main().catch(console.error);
