@echo off
setlocal
echo ==========================================
echo    💹 GoFin - Rust Native Engine
echo ==========================================

echo [INFO] Avvio di Tauri e Vite in corso...
call npx tauri dev

if %errorlevel% neq 0 (
    echo [ERRORE] Qualcosa è andato storto. Assicurati di aver installato le dipendenze di Rust.
    pause
)
