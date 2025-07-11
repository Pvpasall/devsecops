@echo off
REM DevSecOps Platform Deployment Script for Windows
REM ESTIAM E5 - Projet DevSecOps

setlocal enabledelayedexpansion

REM Colors for output (limited in Windows)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

echo.
echo ================================================
echo 🛡️  DevSecOps Platform Deployment (Windows)
echo ================================================
echo.

REM Check if Docker is installed
echo %INFO% Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)
echo %SUCCESS% Docker and Docker Compose are installed

REM Check if environment file exists
echo %INFO% Setting up environment configuration...
if not exist .env (
    if exist env.example (
        copy env.example .env >nul
        echo %SUCCESS% Environment file created from template
        echo %WARNING% Please edit .env file with your Stripe API keys
        echo %WARNING% You can get your Stripe keys from: https://dashboard.stripe.com/apikeys
        echo.
        echo Required environment variables:
        echo - STRIPE_SECRET_KEY=sk_test_...
        echo - STRIPE_PUBLISHABLE_KEY=pk_test_...
        echo.
        echo Press any key after updating the .env file...
        pause >nul
    ) else (
        echo %ERROR% env.example file not found
        pause
        exit /b 1
    )
) else (
    echo %SUCCESS% Environment file already exists
)

REM Build and start services
echo %INFO% Building and starting services...
echo %INFO% Building Docker images...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo %ERROR% Failed to build Docker images
    pause
    exit /b 1
)

echo %INFO% Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo %ERROR% Failed to start services
    pause
    exit /b 1
)

echo %SUCCESS% Services started successfully

REM Wait for services to be ready
echo %INFO% Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Display access information
echo.
echo ======================================
echo 🛡️  DevSecOps Platform Deployed
echo ======================================
echo.
echo 📱 Frontend Application:
echo    http://localhost
echo.
echo 🔗 API Gateway:
echo    http://api.localhost
echo.
echo 💳 Payment Service:
echo    http://payment.localhost
echo.
echo 🛡️  Admin Dashboard (Pentest Target):
echo    http://localhost:8080
echo    Credentials: admin/admin123 or user/user123
echo.
echo ⚠️  WARNING: Admin Dashboard contains intentional vulnerabilities!
echo.
echo 📊 Health Checks:
echo    - Frontend: http://localhost/health
echo    - Admin: http://localhost:8080/health
echo.
echo 🔧 Management Commands:
echo    - View logs: docker-compose logs -f
echo    - Stop services: docker-compose down
echo    - Restart: docker-compose restart
echo.
echo 🧪 Penetration Testing:
echo    - Target: http://localhost:8080
echo    - See README.md for test scenarios
echo.

echo %SUCCESS% Deployment completed successfully!
echo %WARNING% Remember: This platform contains intentional vulnerabilities for educational purposes
echo.
echo Press any key to exit...
pause >nul 