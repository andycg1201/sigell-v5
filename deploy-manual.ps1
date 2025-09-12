# 🚀 SCRIPT DE DESPLIEGUE MANUAL A FIREBASE

Write-Host "🚀 INICIANDO DESPLIEGUE A PRODUCCIÓN..." -ForegroundColor Green

# Verificar que el build existe
if (-not (Test-Path "dist")) {
    Write-Host "❌ Error: Carpeta 'dist' no encontrada. Ejecuta 'npm run build' primero." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build encontrado en carpeta 'dist'" -ForegroundColor Green

# Verificar archivos del build
$requiredFiles = @("index.html", "assets/index-B96xxyfW.css", "assets/index-DZzmV3Dp.js")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path "dist/$file")) {
        Write-Host "❌ Error: Archivo requerido no encontrado: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Todos los archivos del build están presentes" -ForegroundColor Green

# Intentar instalar Firebase CLI si no está disponible
Write-Host "🔧 Verificando Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = & firebase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase CLI disponible: $firebaseVersion" -ForegroundColor Green
    } else {
        throw "Firebase CLI no disponible"
    }
} catch {
    Write-Host "⚠️ Firebase CLI no disponible. Instalando..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase CLI instalado correctamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Intentar hacer login
Write-Host "🔐 Intentando hacer login en Firebase..." -ForegroundColor Yellow
try {
    & firebase login --no-localhost
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Login exitoso en Firebase" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Login falló. Continuando con despliegue..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Error en login. Continuando..." -ForegroundColor Yellow
}

# Configurar proyecto
Write-Host "⚙️ Configurando proyecto Firebase..." -ForegroundColor Yellow
try {
    & firebase use sigell-version-5
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Proyecto configurado: sigell-version-5" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No se pudo configurar proyecto automáticamente" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Error configurando proyecto" -ForegroundColor Yellow
}

# Desplegar
Write-Host "🚀 Iniciando despliegue..." -ForegroundColor Yellow
try {
    & firebase deploy --only hosting
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 ¡DESPLIEGUE EXITOSO!" -ForegroundColor Green
        Write-Host "🌐 URL de producción: https://sigell-version-5.web.app" -ForegroundColor Cyan
        Write-Host "🌐 URL alternativa: https://sigell-version-5.firebaseapp.com" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error en el despliegue" -ForegroundColor Red
        Write-Host "💡 Intenta ejecutar manualmente: firebase deploy --only hosting" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error ejecutando despliegue" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar manualmente: firebase deploy --only hosting" -ForegroundColor Yellow
}

Write-Host "📋 INSTRUCCIONES MANUALES:" -ForegroundColor Magenta
Write-Host "1. Abre https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Selecciona el proyecto 'sigell-version-5'" -ForegroundColor White
Write-Host "3. Ve a 'Hosting' en el menú lateral" -ForegroundColor White
Write-Host "4. Haz clic en 'Agregar otro sitio' o 'Configurar'" -ForegroundColor White
Write-Host "5. Sube los archivos desde la carpeta 'dist/'" -ForegroundColor White
Write-Host "6. Configura el dominio personalizado si es necesario" -ForegroundColor White

Write-Host "✅ Script completado" -ForegroundColor Green
