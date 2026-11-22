# ==============================================================================
# AI Content Generator - Stop Script (PowerShell)
# Gracefully terminates processes running on ports 8000, 5000, and 5173
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Stopping AI Content Generator System...                 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$Ports = @(8000, 5000, 5173)

foreach ($Port in $Ports) {
    try {
        $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($Connections) {
            $ProcessIds = $Connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($PidToStop in $ProcessIds) {
                if ($PidToStop -gt 4) {
                    try {
                        $Proc = Get-Process -Id $PidToStop -ErrorAction SilentlyContinue
                        $ProcName = if ($Proc) { $Proc.ProcessName } else { "Process $PidToStop" }
                        Write-Host "Stopping $ProcName (PID: $PidToStop) on Port $Port..." -ForegroundColor Yellow
                        Stop-Process -Id $PidToStop -Force -ErrorAction SilentlyContinue
                    } catch {}
                }
            }
        } else {
            Write-Host "Port $Port is already free." -ForegroundColor DarkGray
        }
    } catch {
        # Fallback using netstat if Get-NetTCPConnection is unavailable
        $NetstatOut = netstat -ano | Select-String ":$Port "
        foreach ($Line in $NetstatOut) {
            $Tokens = ($Line -split '\s+') | Where-Object { $_ -ne '' }
            $PidToStop = $Tokens[-1]
            if ($PidToStop -match '^\d+$' -and [int]$PidToStop -gt 4) {
                Write-Host "Terminating PID $PidToStop on port $Port..." -ForegroundColor Yellow
                Stop-Process -Id [int]$PidToStop -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " All services have been stopped.                          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
