#!/usr/bin/env pwsh
# scripts/clean-gradle-cache.ps1
# Mata daemons Gradle y limpia todos los caches que causan builds rotos en Windows.
# Uso: npm run android:clean

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==> Deteniendo daemons de Gradle..." -ForegroundColor Cyan
Get-Process -Name "java","javaw" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 1. Limpiar .gradle-build dentro de node_modules (todos los plugins)
Write-Host "==> Limpiando .gradle-build en node_modules..." -ForegroundColor Cyan
$dirs = Get-ChildItem -Path "$projectRoot\node_modules" -Filter ".gradle-build" -Recurse -Directory -ErrorAction SilentlyContinue
foreach ($d in $dirs) {
    cmd /c "rd /s /q ""$($d.FullName)""" 2>$null
    Write-Host "   Eliminado: $($d.FullName)" -ForegroundColor DarkGray
}
$files = Get-ChildItem -Path "$projectRoot\node_modules" -Filter ".gradle-build" -Recurse -File -ErrorAction SilentlyContinue
foreach ($f in $files) {
    Remove-Item -Force $f.FullName -ErrorAction SilentlyContinue
    Write-Host "   Archivo corrupto eliminado: $($f.FullName)" -ForegroundColor Yellow
}

# 2. Limpiar android/.gradle (metadatos de Gradle para este proyecto)
$androidGradle = "$projectRoot\android\.gradle"
if (Test-Path $androidGradle) {
    cmd /c "rd /s /q ""$androidGradle""" 2>$null
    Write-Host "   Eliminado: android/.gradle" -ForegroundColor DarkGray
}

# 3. Limpiar el cache de transforms de Gradle (JARs compilados de plugins)
$transformsCache = "$env:USERPROFILE\.gradle\caches\8.13\transforms"
if (Test-Path $transformsCache) {
    Write-Host "==> Limpiando cache de transforms de Gradle 8.13..." -ForegroundColor Cyan
    cmd /c "rd /s /q ""$transformsCache""" 2>$null
    Write-Host "   Eliminado: $transformsCache" -ForegroundColor DarkGray
}

Write-Host "==> Listo. Ejecuta el build de Android ahora." -ForegroundColor Green