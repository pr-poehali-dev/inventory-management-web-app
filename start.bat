@echo off
chcp 65001 >nul
title WMS — Запуск

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        WMS — Запуск приложения           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Проверка Python ───────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ОШИБКА] Python не найден.
    echo  Скачайте: https://python.org/downloads
    echo  При установке отметьте "Add Python to PATH"
    pause
    exit /b 1
)

:: ── Проверка Node.js ──────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ОШИБКА] Node.js не найден.
    echo  Скачайте: https://nodejs.org  (кнопка LTS)
    pause
    exit /b 1
)

:: ── Установка зависимостей Python (если нет) ─────────────────────
python -c "import firebirdsql" >nul 2>&1
if errorlevel 1 (
    echo  Устанавливаю firebirdsql...
    pip install firebirdsql -q
)

:: ── Установка зависимостей Node (если нет) ───────────────────────
if not exist "node_modules" (
    echo  Устанавливаю npm-зависимости...
    npm install
)

:: ── Читаем настройки из localStorage невозможно из bat,
::    поэтому ищем config-файл или берём дефолты ──────────────────
set FB_HOST=localhost
set FB_DATABASE=
set FB_USER=SYSDBA
set FB_PASSWORD=masterkey
set PORT=8000

:: Если рядом лежит db.config (генерируется при сохранении настроек)
if exist "db.config" (
    echo  Читаю настройки из db.config...
    for /f "tokens=1,2 delims==" %%a in (db.config) do (
        set %%a=%%b
    )
)

echo.
echo  Настройки подключения к БД:
echo    Хост:    %FB_HOST%
echo    База:    %FB_DATABASE%
echo    Порт:    %PORT%
echo.

:: ── Запуск сервера БД в отдельном окне ───────────────────────────
echo  Запускаю сервер базы данных (server.py)...
start "WMS — Сервер БД" cmd /k "python server.py & pause"

:: Даём серверу 2 секунды подняться
timeout /t 2 /nobreak >nul

:: ── Запуск фронтенда ──────────────────────────────────────────────
echo  Запускаю веб-приложение...
start "WMS — Веб-приложение" cmd /k "npm run dev & pause"

:: Даём фронтенду 3 секунды подняться
timeout /t 3 /nobreak >nul

:: ── Открываем браузер ─────────────────────────────────────────────
echo  Открываю браузер...
start http://localhost:5173

echo.
echo  ✓ Всё запущено!
echo.
echo  Веб-приложение: http://localhost:5173
echo  Сервер БД:      http://localhost:%PORT%/health
echo.
echo  Чтобы остановить — закройте окна "WMS — Сервер БД" и "WMS — Веб-приложение"
echo.
pause
