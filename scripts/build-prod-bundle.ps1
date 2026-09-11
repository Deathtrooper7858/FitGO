# Script para generar el Android App Bundle (.aab) de producción de FitGO
$ErrorActionPreference = "Stop"

if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "C:\Users\wrait\AppData\Local\Android\Sdk" }
if (-not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = "C:\Users\wrait\AppData\Local\Android\Sdk" }
$env:APP_VARIANT = "production"
$env:SENTRY_DISABLE_AUTO_UPLOAD = "true"
$env:NODE_OPTIONS = "--max-old-space-size=4096 --expose-gc"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FitGO - Compilando AAB de Producción   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Push-Location android
try {
    .\gradlew.bat app:bundleProductionRelease --build-cache
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($exitCode -eq 0) {
    $aabPath = "android\app\build\outputs\bundle\productionRelease\app-production-release.aab"
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host "  ¡AAB generado exitosamente!           " -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Ruta del bundle: $aabPath" -ForegroundColor Yellow
    if (Test-Path $aabPath) {
        $sizeMB = [math]::Round((Get-Item $aabPath).Length / 1MB, 2)
        Write-Host "Tamaño del archivo: $sizeMB MB" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nError durante la compilación del bundle." -ForegroundColor Red
    exit $exitCode
}
