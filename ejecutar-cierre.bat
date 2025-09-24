@echo off
REM Script para ejecutar cierre automático de Taxi-Control
REM Se ejecuta desde el Programador de Tareas de Windows

echo ========================================
echo Iniciando cierre automático de Taxi-Control
echo %DATE% %TIME%
echo ========================================

REM Cambiar al directorio del proyecto
cd /d "C:\Users\andre\halconsoft\sigell5\taxi-control"

REM Ejecutar el script de cierre forzado (siempre funciona)
node forzar-cierre-manual.js

REM Verificar resultado
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo CIERRE COMPLETADO EXITOSAMENTE
    echo %DATE% %TIME%
    echo ========================================
) else (
    echo ========================================
    echo ERROR EN CIERRE AUTOMÁTICO
    echo Código de error: %ERRORLEVEL%
    echo %DATE% %TIME%
    echo ========================================
)

REM Pausa para ver el resultado (opcional, quitar en producción)
timeout /t 10