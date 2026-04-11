#!/bin/bash

# APK Size Measurement Script
# Task 16.5: Measure and verify APK size < 50MB

set -e

echo "========================================="
echo "FluxGrid APK Size Measurement"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build release APK
echo "Building release APK..."
./gradlew assembleRelease

echo ""
echo "========================================="
echo "APK Size Report"
echo "========================================="
echo ""

# Find all release APKs
APK_DIR="app/build/outputs/apk/release"

if [ ! -d "$APK_DIR" ]; then
    echo "${RED}Error: APK directory not found${NC}"
    exit 1
fi

# Target size in bytes (50MB)
TARGET_SIZE=$((50 * 1024 * 1024))

# Track if any APK exceeds target
EXCEEDS_TARGET=0

# Analyze each APK
for APK in "$APK_DIR"/*.apk; do
    if [ -f "$APK" ]; then
        FILENAME=$(basename "$APK")
        
        # Get file size
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            SIZE=$(stat -f%z "$APK")
        else
            # Linux
            SIZE=$(stat -c%s "$APK")
        fi
        
        # Convert to MB
        SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
        
        # Check if exceeds target
        if [ $SIZE -gt $TARGET_SIZE ]; then
            echo "${RED}✗ $FILENAME: ${SIZE_MB}MB (EXCEEDS 50MB TARGET)${NC}"
            EXCEEDS_TARGET=1
        else
            echo "${GREEN}✓ $FILENAME: ${SIZE_MB}MB${NC}"
        fi
        
        # Show detailed breakdown
        echo "  Analyzing contents..."
        
        # Extract APK to temp directory
        TEMP_DIR=$(mktemp -d)
        unzip -q "$APK" -d "$TEMP_DIR"
        
        # Measure components
        if [ -d "$TEMP_DIR/lib" ]; then
            LIB_SIZE=$(du -sh "$TEMP_DIR/lib" | cut -f1)
            echo "    Native libraries: $LIB_SIZE"
        fi
        
        if [ -d "$TEMP_DIR/res" ]; then
            RES_SIZE=$(du -sh "$TEMP_DIR/res" | cut -f1)
            echo "    Resources: $RES_SIZE"
        fi
        
        if [ -d "$TEMP_DIR/assets" ]; then
            ASSETS_SIZE=$(du -sh "$TEMP_DIR/assets" | cut -f1)
            echo "    Assets: $ASSETS_SIZE"
        fi
        
        if [ -f "$TEMP_DIR/classes.dex" ]; then
            DEX_SIZE=$(du -sh "$TEMP_DIR"/classes*.dex | awk '{sum+=$1} END {print sum}')
            echo "    DEX files: ${DEX_SIZE}K"
        fi
        
        # Clean up
        rm -rf "$TEMP_DIR"
        
        echo ""
    fi
done

echo "========================================="

# Exit with error if any APK exceeds target
if [ $EXCEEDS_TARGET -eq 1 ]; then
    echo "${RED}FAILED: One or more APKs exceed 50MB target${NC}"
    echo ""
    echo "Optimization suggestions:"
    echo "  1. Enable resource shrinking (shrinkResources = true)"
    echo "  2. Use split APKs by ABI"
    echo "  3. Convert images to WebP format"
    echo "  4. Remove unused dependencies"
    echo "  5. Use App Bundle (AAB) instead of APK"
    echo ""
    exit 1
else
    echo "${GREEN}SUCCESS: All APKs are under 50MB target${NC}"
    echo ""
fi

# Show AAB size if available
AAB_DIR="app/build/outputs/bundle/release"
if [ -d "$AAB_DIR" ]; then
    echo "========================================="
    echo "App Bundle (AAB) Size"
    echo "========================================="
    echo ""
    
    for AAB in "$AAB_DIR"/*.aab; do
        if [ -f "$AAB" ]; then
            FILENAME=$(basename "$AAB")
            
            if [[ "$OSTYPE" == "darwin"* ]]; then
                SIZE=$(stat -f%z "$AAB")
            else
                SIZE=$(stat -c%s "$AAB")
            fi
            
            SIZE_MB=$(echo "scale=2; $SIZE / 1024 / 1024" | bc)
            echo "${GREEN}$FILENAME: ${SIZE_MB}MB${NC}"
            echo ""
            echo "Note: AAB size is larger than APK, but Play Store generates"
            echo "optimized APKs that are typically 15-20% smaller for end users."
            echo ""
        fi
    done
fi

echo "========================================="
echo "Build complete!"
echo "========================================="
