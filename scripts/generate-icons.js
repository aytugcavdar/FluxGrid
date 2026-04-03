/**
 * Android Icon Generator
 * Generates all required Android icon sizes from source SVG
 * 
 * Usage: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for different densities
const ICON_SIZES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

// Paths
const SOURCE_ICON = path.join(__dirname, '../public/icon-192.svg');
const ANDROID_RES = path.join(__dirname, '../android/app/src/main/res');

/**
 * Generate icons for all densities
 */
async function generateIcons() {
  console.log('🎨 Generating Android icons...');
  
  // Check if source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    console.log('Please ensure icon-192.svg exists in the public directory');
    process.exit(1);
  }
  
  // Generate icons for each density
  for (const [density, size] of Object.entries(ICON_SIZES)) {
    const outputDir = path.join(ANDROID_RES, `mipmap-${density}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'ic_launcher.png');
    const outputRoundPath = path.join(outputDir, 'ic_launcher_round.png');
    
    try {
      // Generate square icon
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 13, g: 17, b: 23, alpha: 1 } // #0d1117
        })
        .png()
        .toFile(outputPath);
      
      // Generate round icon (same as square for now)
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 13, g: 17, b: 23, alpha: 1 }
        })
        .png()
        .toFile(outputRoundPath);
      
      console.log(`✅ Generated ${density} icons (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${density} icons:`, error.message);
    }
  }
  
  console.log('✨ Icon generation complete!');
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Icon generation failed:', error);
  process.exit(1);
});
