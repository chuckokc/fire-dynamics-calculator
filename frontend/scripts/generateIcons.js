import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, Image } from 'canvas';
import { generateSVGString } from './iconTemplate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [
  16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512
];

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of ICON_SIZES) {
    try {
      console.log(`Generating icon size: ${size}x${size}`);
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      const svg = generateSVGString(size, false);
      const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          const out = fs.createWriteStream(path.join(iconsDir, `icon-${size}x${size}.png`));
          const stream = canvas.createPNGStream();
          stream.pipe(out);
          out.on('finish', () => {
            console.log(`Created icon-${size}x${size}.png`);
            resolve();
          });
          out.on('error', reject);
        };
        img.onerror = reject;
        img.src = svgUrl;
      });
    } catch (error) {
      console.error(`Error generating ${size}x${size} icon:`, error);
    }
  }

  // Generate maskable icon
  try {
    console.log('Generating maskable icon');
    const size = 512;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    const svg = generateSVGString(size, true);
    const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        const out = fs.createWriteStream(path.join(iconsDir, 'maskable-icon.png'));
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => {
          console.log('Created maskable-icon.png');
          resolve();
        });
        out.on('error', reject);
      };
      img.onerror = reject;
      img.src = svgUrl;
    });
  } catch (error) {
    console.error('Error generating maskable icon:', error);
  }
}

// Run the icon generation
generateIcons()
  .then(() => console.log('Icon generation complete'))
  .catch(error => console.error('Icon generation failed:', error));