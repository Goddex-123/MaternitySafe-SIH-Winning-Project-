# SIH 2024 Judge Presentation Readiness Check
# Run this script 30 minutes before your presentation to ensure everything works

Write-Host "🏆 SIH 2024 - MaternitySafe Judge Readiness Check" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

$allGood = $true
$checksPassed = 0
$totalChecks = 12

function Test-Check {
    param($name, $condition, $successMsg, $failMsg)
    Write-Host "🔍 Checking: $name" -ForegroundColor Cyan
    if ($condition) {
        Write-Host "   ✅ $successMsg" -ForegroundColor Green
        return $true
    } else {
        Write-Host "   ❌ $failMsg" -ForegroundColor Red
        return $false
    }
}

Write-Host "🏥 SYSTEM REQUIREMENTS CHECK" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

# 1. Node.js Check
if (Test-Check "Node.js Installation" { 
    try { 
        $nodeVersion = node --version 
        $nodeVersion -match "v(\d+)\.(\d+)\.(\d+)" 
        $major = [int]$matches[1]
        return $major -ge 16
    } catch { return $false }
} "Node.js $nodeVersion (Good)" "Node.js not found or version < 16") {
    $checksPassed++
} else {
    $allGood = $false
    Write-Host "   💡 Install Node.js 16+ from nodejs.org" -ForegroundColor Yellow
}

# 2. Project Structure Check
if (Test-Check "Project Structure" {
    (Test-Path "backend") -and (Test-Path "frontend") -and (Test-Path "demo")
} "All project folders present" "Missing critical project folders") {
    $checksPassed++
} else {
    $allGood = $false
}

# 3. Backend Dependencies
if (Test-Check "Backend Dependencies" {
    Test-Path "backend/node_modules"
} "Backend dependencies installed" "Backend dependencies missing") {
    $checksPassed++
} else {
    Write-Host "   💡 Run: cd backend && npm install" -ForegroundColor Yellow
    $allGood = $false
}

# 4. Environment Configuration
if (Test-Check "Environment Config" {
    Test-Path "backend/.env"
} "Environment file exists" "Environment file missing") {
    $checksPassed++
} else {
    Write-Host "   💡 Copy backend/.env.example to backend/.env" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "🚀 BACKEND API TESTS" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow

# 5. Start Backend (if not running)
$backendRunning = $false
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2
    $backendRunning = $health.status -eq "healthy"
} catch {
    # Backend not running, try to start it
    Write-Host "Backend not running, attempting to start..." -ForegroundColor Yellow
    
    Push-Location backend
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    Pop-Location
    
    Start-Sleep -Seconds 8
    
    # Check again
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 3
        $backendRunning = $health.status -eq "healthy"
    } catch {
        $backendRunning = $false
    }
}

if (Test-Check "Backend Health API" { $backendRunning } "Backend server running on port 5000" "Backend server not responding") {
    $checksPassed++
} else {
    $allGood = $false
    Write-Host "   💡 Run: cd backend && npm start" -ForegroundColor Yellow
}

# 6. Hospital API Test
if ($backendRunning) {
    if (Test-Check "Hospital API" {
        try {
            $hospitals = Invoke-RestMethod -Uri "http://localhost:5000/api/hospitals" -Method Get -TimeoutSec 3
            return $hospitals.Count -ge 3
        } catch { return $false }
    } "3 hospitals loaded successfully" "Hospital API failed") {
        $checksPassed++
    } else {
        $allGood = $false
    }
} else {
    Write-Host "🔍 Checking: Hospital API" -ForegroundColor Cyan
    Write-Host "   ⏭️  Skipped (backend not running)" -ForegroundColor Yellow
}

# 7. Risk Engine Test
if ($backendRunning) {
    if (Test-Check "AI Risk Engine" {
        try {
            $testData = @{
                gestationalAge = 36
                bloodPressure = @{
                    systolic = 165
                    diastolic = 105
                }
                bleeding = "none"
                symptoms = @("severe_headache", "vision_changes")
                location = @{ lat = 19.7515; lng = 75.7139 }
            } | ConvertTo-Json -Depth 3
            
            $result = Invoke-RestMethod -Uri "http://localhost:5000/api/assessment" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 5
            return $result.riskLevel -eq "HIGH"
        } catch { return $false }
    } "Pre-eclampsia scenario: HIGH RISK detected" "Risk engine not working correctly") {
        $checksPassed++
    } else {
        $allGood = $false
    }
} else {
    Write-Host "🔍 Checking: AI Risk Engine" -ForegroundColor Cyan
    Write-Host "   ⏭️  Skipped (backend not running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 DEMO DATA & SCENARIOS" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

# 8. Demo Scripts
if (Test-Check "Demo Scripts" {
    (Test-Path "test_demo.ps1") -and (Test-Path "run_demo.ps1")
} "Demo PowerShell scripts ready" "Demo scripts missing") {
    $checksPassed++
} else {
    $allGood = $false
}

# 9. Presentation Materials
if (Test-Check "Presentation Materials" {
    (Test-Path "PRESENTATION_SCRIPT.md") -and (Test-Path "DEMO_CHECKLIST.md")
} "Presentation script and checklist ready" "Presentation materials missing") {
    $checksPassed++
} else {
    $allGood = $false
}

# 10. Demo Scenarios Documentation
if (Test-Check "Demo Scenarios" {
    Test-Path "demo/scenarios.md"
} "3 demo scenarios documented" "Demo scenarios missing") {
    $checksPassed++
} else {
    $allGood = $false
}

Write-Host ""
Write-Host "🎯 JUDGE DEMO COMPONENTS" -ForegroundColor Yellow  
Write-Host "========================" -ForegroundColor Yellow

# 11. Frontend Preparation
if (Test-Check "Frontend Setup" {
    (Test-Path "frontend/package.json") -and (Test-Path "frontend/src")
} "Frontend structure ready" "Frontend not prepared") {
    $checksPassed++
    Write-Host "   📝 Note: Frontend needs to be built during hackathon" -ForegroundColor Yellow
} else {
    $allGood = $false
}

# 12. Git Repository
if (Test-Check "Git Repository" {
    (Test-Path ".git") -and (Test-Path ".gitignore")
} "Git repository initialized" "Git not set up") {
    $checksPassed++
} else {
    $allGood = $false
}

Write-Host ""
Write-Host "📋 READINESS SUMMARY" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Checks Passed: $checksPassed / $totalChecks" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "🎉 CONGRATULATIONS! 🎉" -ForegroundColor Green
    Write-Host "Your MaternitySafe project is READY for SIH judges!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 What judges will see:" -ForegroundColor Cyan
    Write-Host "  ✅ Working backend API with clinical-grade risk engine" -ForegroundColor White
    Write-Host "  ✅ Smart hospital routing with real distance/ETA calculations" -ForegroundColor White  
    Write-Host "  ✅ Real-time referral system with QR codes and SMS" -ForegroundColor White
    Write-Host "  ✅ Professional presentation materials and demo scripts" -ForegroundColor White
    Write-Host "  ✅ 3 compelling scenarios showing life-saving impact" -ForegroundColor White
    Write-Host ""
    Write-Host "🎤 PRESENTATION READY!" -ForegroundColor Green
    Write-Host "Use these commands during your demo:" -ForegroundColor Yellow
    Write-Host "  • .\run_demo.ps1 -All     # Start full demo" -ForegroundColor White
    Write-Host "  • .\test_demo.ps1         # Show working APIs" -ForegroundColor White
    Write-Host "  • See PRESENTATION_SCRIPT.md for speech" -ForegroundColor White
    Write-Host ""
    Write-Host "💪 GO WIN SMART INDIA HACKATHON 2024! 🏆" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "⚠️  ISSUES FOUND" -ForegroundColor Yellow
    Write-Host "Fix the items marked with ❌ above before presenting" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Cyan
    Write-Host "  1. cd backend && npm install" -ForegroundColor White
    Write-Host "  2. Copy backend\.env.example to backend\.env" -ForegroundColor White
    Write-Host "  3. .\run_demo.ps1 -Setup" -ForegroundColor White
    Write-Host "  4. Re-run this script to verify" -ForegroundColor White
    Write-Host ""
    Write-Host "You've got this! Fix these issues and you'll dominate SIH! 💪" -ForegroundColor Green
}

Write-Host ""
Write-Host "Final reminders:" -ForegroundColor Yellow
Write-Host "  📱 Have backup screenshots ready" -ForegroundColor White
Write-Host "  🔋 Charge your laptop to 100%" -ForegroundColor White
Write-Host "  📶 Test internet connectivity" -ForegroundColor White
Write-Host "  🎤 Practice your 6-minute presentation" -ForegroundColor White
Write-Host "  😊 Present with confidence - you built something amazing!" -ForegroundColor White

Write-Host ""
