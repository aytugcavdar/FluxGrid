# APK Size Measurement Script (PowerShell)
# Task 16.5: Measure and verify APK size < 50MB

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FluxGrid APK Size Measurement" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Build release APK
Write-Host "Building release APK..." -ForegroundColor Yellow
& .\gradlew.bat assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APK Size Report" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Find all release APKs
$APK_DIR = "app\build\outputs\apk\release"

if (-not (Test-Path $APK_DIR)) {
    Write-Host "Error: APK directory not found" -ForegroundColor Red
    exit 1
}

# Target size in bytes (50MB)
$TARGET_SIZE = 50 * 1024 * 1024

# Track if any APK exceeds target
$EXCEEDS_TARGET = $false

# Analyze each APK
Get-ChildItem -Path $APK_DIR -Filter "*.apk" | ForEach-Object {
    $APK = $_.FullName
    $FILENAME = $_.Name
    
    # Get file size
    $SIZE = (Get-Item $APK).Length
    
    # Convert to MB
    $SIZE_MB = [math]::Round($SIZE / 1024 / 1024, 2)
    
    # Check if exceeds target
    if ($SIZE -gt $TARGET_SIZE) {
        Write-Host "✗ $FILENAME : ${SIZE_MB}MB (EXCEEDS 50MB TARGET)" -ForegroundColor Red
        $EXCEEDS_TARGET = $true
    } else {
        Write-Host "✓ $FILENAME : ${SIZE_MB}MB" -ForegroundColor Green
    }
    
    Write-Host "  Analyzing contents..." -ForegroundColor Gray
    
    # Extract APK to temp directory
    $TEMP_DIR = Join-Path $env:TEMP "apk_analysis_$(Get-Random)"
    New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null
    
    # Extract using Expand-Archive
    try {
        Expand-Archive -Path $APK -DestinationPath $TEMP_DIR -Force
        
        # Measure components
        if (Test-Path "$TEMP_DIR\lib") {
            $LIB_SIZE = (Get-ChildItem -Path "$TEMP_DIR\lib" -Recurse | Measure-Object -Property Length -Sum).Sum
            $LIB_SIZE_MB = [math]::Round($LIB_SIZE / 1024 / 1024, 2)
            Write-Host "    Native libraries: ${LIB_SIZE_MB}MB" -ForegroundColor Gray
        }
        
        if (Test-Path "$TEMP_DIR\res") {
            $RES_SIZE = (Get-ChildItem -Path "$TEMP_DIR\res" -Recurse | Measure-Object -Property Length -Sum).Sum
            $RES_SIZE_MB = [math]::Round($RES_SIZE / 1024 / 1024, 2)
            Write-Host "    Resources: ${RES_SIZE_MB}MB" -ForegroundColor Gray
        }
        
        if (Test-Path "$TEMP_DIR\assets") {
            $ASSETS_SIZE = (Get-ChildItem -Path "$TEMP_DIR\assets" -Recurse | Measure-Object -Property Length -Sum).Sum
            $ASSETS_SIZE_MB = [math]::Round($ASSETS_SIZE / 1024 / 1024, 2)
            Write-Host "    Assets: ${ASSETS_SIZE_MB}MB" -ForegroundColor Gray
        }
        
        $DEX_FILES = Get-ChildItem -Path $TEMP_DIR -Filter "classes*.dex"
        if ($DEX_FILES) {
            $DEX_SIZE = ($DEX_FILES | Measure-Object -Property Length -Sum).Sum
            $DEX_SIZE_MB = [math]::Round($DEX_SIZE / 1024 / 1024, 2)
            Write-Host "    DEX files: ${DEX_SIZE_MB}MB" -ForegroundColor Gray
        }
    } catch {
        Write-Host "    Warning: Could not analyze APK contents" -ForegroundColor Yellow
    } finally {
        # Clean up
        Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Cyan

# Exit with error if any APK exceeds target
if ($EXCEEDS_TARGET) {
    Write-Host "FAILED: One or more APKs exceed 50MB target" -ForegroundColor Red
    Write-Host ""
    Write-Host "Optimization suggestions:" -ForegroundColor Yellow
    Write-Host "  1. Enable resource shrinking (shrinkResources = true)"
    Write-Host "  2. Use split APKs by ABI"
    Write-Host "  3. Convert images to WebP format"
    Write-Host "  4. Remove unused dependencies"
    Write-Host "  5. Use App Bundle (AAB) instead of APK"
    Write-Host ""
    exit 1
} else {
    Write-Host "SUCCESS: All APKs are under 50MB target" -ForegroundColor Green
    Write-Host ""
}

# Show AAB size if available
$AAB_DIR = "app\build\outputs\bundle\release"
if (Test-Path $AAB_DIR) {
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "App Bundle (AAB) Size" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Get-ChildItem -Path $AAB_DIR -Filter "*.aab" | ForEach-Object {
        $AAB = $_.FullName
        $FILENAME = $_.Name
        
        $SIZE = (Get-Item $AAB).Length
        $SIZE_MB = [math]::Round($SIZE / 1024 / 1024, 2)
        
        Write-Host "$FILENAME : ${SIZE_MB}MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Note: AAB size is larger than APK, but Play Store generates" -ForegroundColor Gray
        Write-Host "optimized APKs that are typically 15-20% smaller for end users." -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Build complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
