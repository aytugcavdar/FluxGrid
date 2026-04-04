#!/usr/bin/env node

/**
 * Generate Android launcher icons from SVG source
 * Generates all mipmap densities and adaptive icon layers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('Error: sharp is not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const sharp = require('sharp');

// Configuration
const SOURCE_ICON = path.join(__dirname, '../public/icon-512.svg');
const OUTPUT_DIR = path.join(__dirname, '../android/app/src/main/res');

// Mipmap densities (Android launcher icon sizes)
const DENSITIES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

// Adaptive icon sizes (Android 8.0+)
const ADAPTIVE_DENSITIES = {
  'mdpi': 108,
  'hdpi': 162,
  'xhdpi': 216,
  'xxhdpi': 324,
  'xxxhdpi': 432
};

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate standard launcher icons
 */
async function generateMipmapIcons() {
  console.log('Generating mipmap icons...');
  
  for (const [density, size] of Object.entries(DENSITIES)) {
    const outputDir = path.join(OUTPUT_DIR, `mipmap-${density}`);
    ensureDir(outputDir);
    
    const outputFile = path.join(outputDir, 'ic_launcher.png');
    
    await sharp(SOURCE_ICON)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    
    console.log(`  ✓ Generated ${density}: ${size}x${size}px`);
  }
}

/**
 * Generate adaptive icon foreground layers
 */
async function generateAdaptiveIcons() {
  console.log('Generating adaptive icon layers...');
  
  for (const [density, size] of Object.entries(ADAPTIVE_DENSITIES)) {
    const outputDir = path.join(OUTPUT_DIR, `mipmap-${density}`);
    ensureDir(outputDir);
    
    // Foreground layer (icon with padding)
    const foregroundFile = path.join(outputDir, 'ic_launcher_foreground.png');
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(foregroundFile);
    
    console.log(`  ✓ Generated ${density} foreground: ${size}x${size}px`);
  }
}

/**
 * Generate adaptive icon XML
 */
function generateAdaptiveIconXML() {
  console.log('Generating adaptive icon XML...');
  
  const xmlDir = path.join(OUTPUT_DIR, 'mipmap-anydpi-v26');
  ensureDir(xmlDir);
  
  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  fs.writeFileSync(path.join(xmlDir, 'ic_launcher.xml'), xmlContent);
  fs.writeFileSync(path.join(xmlDir, 'ic_launcher_round.xml'), xmlContent);
  
  console.log('  ✓ Generated adaptive icon XML');
}

/**
 * Generate background color resource
 */
function generateBackgroundColor() {
  console.log('Generating background color...');
  
  const valuesDir = path.join(OUTPUT_DIR, 'values');
  ensureDir(valuesDir);
  
  const colorsFile = path.join(valuesDir, 'colors.xml');
  let colorsContent = '';
  
  // Read existing colors.xml if it exists
  if (fs.existsSync(colorsFile)) {
    colorsContent = fs.readFileSync(colorsFile, 'utf-8');
  } else {
    colorsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
</resources>`;
  }
  
  // Add ic_launcher_background if not present
  if (!colorsContent.includes('ic_launcher_background')) {
    colorsContent = colorsContent.replace(
      '</resources>',
      '    <color name="ic_launcher_background">#0d1117</color>\n</resources>'
    );
    fs.writeFileSync(colorsFile, colorsContent);
    console.log('  ✓ Added ic_launcher_background color');
  } else {
    console.log('  ✓ ic_launcher_background color already exists');
  }
}

/**
 * Generate Play Store feature graphic placeholder
 */
async function generateFeatureGraphic() {
  console.log('Generating Play Store feature graphic placeholder...');
  
  const playStoreDir = path.join(__dirname, '../play-store-assets');
  ensureDir(playStoreDir);
  
  const featureGraphicFile = path.join(playStoreDir, 'feature-graphic.png');
  
  // Create a simple placeholder (1024x500)
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 13, g: 17, b: 23, alpha: 1 }
    }
  })
  .png()
  .toFile(featureGraphicFile);
  
  console.log('  ✓ Generated feature graphic placeholder (1024x500)');
  console.log('  ⚠ Replace with actual design before Play Store submission');
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 FluxGrid Icon Generator\n');
  
  // Check if source icon exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }
  
  try {
    await generateMipmapIcons();
    await generateAdaptiveIcons();
    generateAdaptiveIconXML();
    generateBackgroundColor();
    await generateFeatureGraphic();
    
    console.log('\n✅ Icon generation complete!');
    console.log('\nNext steps:');
    console.log('  1. Review generated icons in android/app/src/main/res/mipmap-*');
    console.log('  2. Replace play-store-assets/feature-graphic.png with actual design');
    console.log('  3. Capture 8 screenshots for Play Store listing');
    console.log('  4. Run: npx cap sync android');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
