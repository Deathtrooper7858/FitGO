# Script robusto para compilar, instalar y lanzar la build de desarrollo en Android
param(
    [switch]$ForceReinstall = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FitGO - Android Development Launcher" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verificar dispositivos ADB
$devicesOutput = (adb devices) | Out-String
$hasDevice = $devicesOutput -split "`r?`n" | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices attached" }

if (-not $hasDevice) {
    Write-Warning "AVISO: No se detecto ningun dispositivo o emulador conectado por ADB."
    Write-Host "Se compilara el APK con 'assembleDevelopmentDebug' para verificar la build."
    Write-Host "Para instalar y abrir en tu dispositivo, asegurate de conectarlo por USB (Depuracion USB activa) o iniciar un emulador.`n" -ForegroundColor DarkGray
    
    Push-Location android
    .\gradlew.bat app:assembleDevelopmentDebug --build-cache -PreactNativeArchitectures=arm64-v8a
    $compileExit = $LASTEXITCODE
    Pop-Location

    if ($compileExit -eq 0) {
        Write-Host "`n[✓] APK compilado exitosamente en android/app/build/outputs/apk/development/debug/app-development-debug.apk" -ForegroundColor Green
        Write-Host "Conecta tu dispositivo y vuelve a ejecutar 'npm run android:dev:run' para instalarlo y lanzarlo automaticamente.`n" -ForegroundColor Cyan
    } else {
        Write-Error "ERROR: Fallo la compilacion de Gradle."
        exit $compileExit
    }
    exit 0
}

Write-Host "Dispositivo detectado:" -ForegroundColor Green
$hasDevice | ForEach-Object { Write-Host " - $_" -ForegroundColor Green }

# 2. Configurar reverse ADB para Metro Server (8081)
Write-Host "`n[1/4] Configurando tunel ADB reverse (puerto 8081)..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081

# Si se fuerza la reinstalacion manual
if ($ForceReinstall) {
    Write-Host "Desinstalando version previa de com.fitgo.app..." -ForegroundColor Yellow
    adb uninstall com.fitgo.app
}

# 3. Compilar e instalar mediante Gradle
Write-Host "`n[2/4] Compilando e instalando con Gradle (installDevelopmentDebug)..." -ForegroundColor Yellow
Push-Location android
.\gradlew.bat app:installDevelopmentDebug --build-cache -PreactNativeArchitectures=arm64-v8a -PreactNativeDevServerPort=8081
$gradleExit = $LASTEXITCODE
Pop-Location

# 4. Manejo de error de firma incompatible (INSTALL_FAILED_UPDATE_INCOMPATIBLE)
$apkPath = "android\app\build\outputs\apk\development\debug\app-development-debug.apk"

if ($gradleExit -ne 0) {
    Write-Warning "`n[!] Gradle installDevelopmentDebug fallo (codigo: $gradleExit)."
    
    if (Test-Path $apkPath) {
        Write-Host "El APK de desarrollo se genero en: $apkPath" -ForegroundColor Green
        Write-Host "Resolviendo conflicto de firmas (version Release / EAS previa en el dispositivo)..." -ForegroundColor Yellow
        Write-Host "Desinstalando paquete existente com.fitgo.app..." -ForegroundColor Cyan
        adb uninstall com.fitgo.app

        Write-Host "Instalando APK de desarrollo via ADB..." -ForegroundColor Cyan
        adb install -r $apkPath
        $installExit = $LASTEXITCODE

        if ($installExit -ne 0) {
            Write-Error "ERROR: No se pudo instalar el APK. Verifica que el dispositivo este desbloqueado y con depuracion activa."
            exit 1
        }
        Write-Host "[✓] APK de desarrollo instalado con exito." -ForegroundColor Green
    } else {
        Write-Error "ERROR: La compilacion no genero el APK."
        exit 1
    }
}

# 5. Re-establecer tunel y lanzar la app
Write-Host "`n[3/4] Verificando tunel ADB al servidor Metro..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
Start-Sleep -Seconds 1

Write-Host "`n[4/4] Lanzando FitGO (expo-development-client)..." -ForegroundColor Yellow
adb shell am start -a android.intent.action.VIEW -d "exp+fitgo://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.fitgo.app

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  FitGO Development Build lista y corriendo!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
