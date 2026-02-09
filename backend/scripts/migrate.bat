@echo off
REM Quick migration script for Windows

echo ================================
echo  Macsauce Bomber - Migrations
echo ================================
echo.

if "%1"=="" (
    echo Usage:
    echo   migrate.bat upgrade    - Run all pending migrations
    echo   migrate.bat downgrade  - Rollback last migration
    echo   migrate.bat current    - Show current version
    echo   migrate.bat history    - Show migration history
    echo   migrate.bat create "description" - Create new migration
    echo.
    exit /b
)

cd ..

if "%1"=="upgrade" (
    echo Running migrations...
    venv\Scripts\python.exe -m alembic upgrade head
) else if "%1"=="downgrade" (
    echo Rolling back migration...
    venv\Scripts\python.exe -m alembic downgrade -1
) else if "%1"=="current" (
    echo Current migration version:
    venv\Scripts\python.exe -m alembic current
) else if "%1"=="history" (
    echo Migration history:
    venv\Scripts\python.exe -m alembic history --verbose
) else if "%1"=="create" (
    if "%2"=="" (
        echo Error: Please provide a description for the migration
        exit /b 1
    )
    echo Creating new migration: %2
    venv\Scripts\python.exe -m alembic revision --autogenerate -m "%~2"
) else (
    echo Unknown command: %1
    echo Run 'migrate.bat' without arguments to see usage
)

echo.
echo Done!
