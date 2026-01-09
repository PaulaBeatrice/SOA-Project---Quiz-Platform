# Quick Install Prerequisites for Quiz Platform
# Run this as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quiz Platform - Prerequisites Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "Checking current installations..." -ForegroundColor Yellow
Write-Host ""

# Check Java
Write-Host "Checking Java..." -ForegroundColor White
try {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Host "✅ Java is installed: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Java is NOT installed" -ForegroundColor Red
    Write-Host "   Please install Java 17 from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
}

# Check Maven
Write-Host "Checking Maven..." -ForegroundColor White
try {
    $mavenVersion = mvn -version 2>&1 | Select-String "Apache Maven" | Select-Object -First 1
    Write-Host "✅ Maven is installed: $mavenVersion" -ForegroundColor Green
    $mavenInstalled = $true
} catch {
    Write-Host "❌ Maven is NOT installed" -ForegroundColor Red
    $mavenInstalled = $false
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor White
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    $dockerInstalled = $true
} catch {
    Write-Host "❌ Docker is NOT installed" -ForegroundColor Red
    $dockerInstalled = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($mavenInstalled -and $dockerInstalled) {
    Write-Host "✅ All prerequisites are installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run the platform:" -ForegroundColor White
    Write-Host "  cd C:\UBB\QuizPlatform" -ForegroundColor Yellow
    Write-Host "  mvn clean package -DskipTests" -ForegroundColor Yellow
    Write-Host "  .\build.ps1" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "Installing missing prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Install Chocolatey if not present
Write-Host "Checking for Chocolatey package manager..." -ForegroundColor White
try {
    choco --version | Out-Null
    Write-Host "✅ Chocolatey is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    try {
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Chocolatey" -ForegroundColor Red
        Write-Host "Please install manually from: https://chocolatey.org/install" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit
    }
}

Write-Host ""

# Install Maven
if (-not $mavenInstalled) {
    Write-Host "Installing Apache Maven..." -ForegroundColor Yellow
    try {
        choco install maven -y
        Write-Host "✅ Maven installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Maven" -ForegroundColor Red
        Write-Host "Please install manually from: https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    }
}

# Install Docker Desktop
if (-not $dockerInstalled) {
    Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
    Write-Host "Note: This will download ~500MB and may take a while..." -ForegroundColor Gray
    try {
        choco install docker-desktop -y
        Write-Host "✅ Docker Desktop installed successfully" -ForegroundColor Green
        Write-Host "⚠️  You MUST restart your computer for Docker to work!" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to install Docker Desktop" -ForegroundColor Red
        Write-Host "Please install manually from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please restart your computer now!" -ForegroundColor Yellow
Write-Host ""
Write-Host "After restart, open PowerShell and run:" -ForegroundColor White
Write-Host "  cd C:\UBB\QuizPlatform" -ForegroundColor Cyan
Write-Host "  mvn clean package -DskipTests" -ForegroundColor Cyan
Write-Host "  .\build.ps1" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"

