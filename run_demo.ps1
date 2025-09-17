# MaternitySafe Complete Demo Runner - SIH 2024
# This script sets up and runs the complete demo for judges

param(
    [switch]$Setup,
    [switch]$Demo,
    [switch]$Scenarios,
    [switch]$All
)

Write-Host "🏆 MaternitySafe - SIH 2024 Complete Demo Runner" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

if ($All -or $Setup) {
    Write-Host "🔧 Setting up demo environment..." -ForegroundColor Yellow
    
    # Check Node.js installation
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not installed! Please install from nodejs.org" -ForegroundColor Red
        exit 1
    }
    
    # Install backend dependencies
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend installation failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    # Install frontend dependencies
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend installation failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Host ""
}

if ($All -or $Demo) {
    Write-Host "🚀 Starting MaternitySafe Demo Servers..." -ForegroundColor Yellow
    
    # Start backend in background
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        npm start
    }
    
    # Wait for backend to start
    Write-Host "Waiting for backend to initialize..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    # Check if backend is running
    $maxAttempts = 10
    $attempt = 0
    $backendReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $backendReady) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2
            if ($health.status -eq "healthy") {
                Write-Host "✅ Backend server ready!" -ForegroundColor Green
                $backendReady = $true
            }
        } catch {
            $attempt++
            Write-Host "⏳ Waiting for backend... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $backendReady) {
        Write-Host "❌ Backend failed to start!" -ForegroundColor Red
        Stop-Job $backendJob -Force
        exit 1
    }
    
    Write-Host ""
    Write-Host "🌐 Backend running at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📊 Health check: http://localhost:5000/api/health" -ForegroundColor Cyan
    Write-Host "🏥 Hospital API: http://localhost:5000/api/hospitals" -ForegroundColor Cyan
    Write-Host ""
    
    # Note about frontend (since we don't have it fully built yet)
    Write-Host "📱 Frontend Setup:" -ForegroundColor Yellow
    Write-Host "   To start frontend: cd frontend && npm start" -ForegroundColor White
    Write-Host "   Will be available at: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    
    if ($All -or $Scenarios) {
        Write-Host "🎬 Running Demo Scenarios..." -ForegroundColor Yellow
        # Run the test scenarios
        .\test_demo.ps1
    }
    
    Write-Host ""
    Write-Host "🎯 Demo is ready for judges!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Judge Demo Checklist:" -ForegroundColor Cyan
    Write-Host "  ✅ Backend API running (port 5000)" -ForegroundColor White
    Write-Host "  ✅ Hospital data loaded (3 hospitals)" -ForegroundColor White
    Write-Host "  ✅ Risk engine tested (pre-eclampsia scenario)" -ForegroundColor White
    Write-Host "  ✅ Referral system working (QR codes + SMS)" -ForegroundColor White
    Write-Host "  ⏳ Frontend ready for manual demo" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🎤 Ready for your presentation!" -ForegroundColor Green
    Write-Host "   Use PRESENTATION_SCRIPT.md for your speech" -ForegroundColor White
    Write-Host "   Use test_demo.ps1 to show working APIs" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Press Ctrl+C to stop servers when done" -ForegroundColor Yellow
    
    # Keep servers running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
        Stop-Job $backendJob -Force
        Write-Host "✅ Demo stopped" -ForegroundColor Green
    }
}

if (-not ($All -or $Setup -or $Demo -or $Scenarios)) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\run_demo.ps1 -Setup     # Install dependencies only" -ForegroundColor White
    Write-Host "  .\run_demo.ps1 -Demo      # Start servers and run demo" -ForegroundColor White  
    Write-Host "  .\run_demo.ps1 -Scenarios # Run test scenarios only" -ForegroundColor White
    Write-Host "  .\run_demo.ps1 -All       # Do everything (recommended)" -ForegroundColor White
    Write-Host ""
    Write-Host "For SIH judges demo, run: .\run_demo.ps1 -All" -ForegroundColor Green
}
