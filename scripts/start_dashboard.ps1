# Start both the Python API backend and the Express dashboard server
# Python backend: http://localhost:8080
# Express dashboard: http://localhost:3000

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PythonServer = Join-Path $ProjectRoot "dashboard" "serve.py"
$DashboardDir = Join-Path $ProjectRoot "dashboard"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Vietnamese LLM Red-Teaming Dashboard" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Python API backend (port 8080)..." -ForegroundColor Yellow
$pyJob = Start-Process -NoNewWindow -FilePath "python" -ArgumentList "$PythonServer" -PassThru
Start-Sleep -Seconds 2

Write-Host "Starting Express dashboard (port 3000)..." -ForegroundColor Yellow
Set-Location $DashboardDir
$expressJob = Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "tsx server.ts" -PassThru

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "  Dashboard ready!" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  API:      http://localhost:8080/api/results" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray

try {
    Wait-Process -Id $pyJob.Id, $expressJob.Id
} catch {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Process -Id $pyJob.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $expressJob.Id -Force -ErrorAction SilentlyContinue
}
