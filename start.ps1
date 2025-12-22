# PowerShell wrapper to run start.sh with Git Bash

$gitBashPaths = @(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files (x86)\Git\bin\bash.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe",
    "$env:ProgramFiles\Git\bin\bash.exe"
)

$bashPath = $gitBashPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($bashPath) {
    Write-Host "Running start.sh with Git Bash..." -ForegroundColor Cyan
    & $bashPath -c "./start.sh"
} else {
    Write-Host "Git Bash not found. Please install Git for Windows or use start.bat instead." -ForegroundColor Red
    Write-Host "Download Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
}
