# Một lệnh: cài phụ thuộc, bật api+shop+admin, chờ sẵn sàng, chạy e2e rồi tắt server.
# -Serve: chỉ mở prototype cho tự thao tác (không chạy e2e), Ctrl+C để tắt.
param([switch]$Serve)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$env:PLAYWRIGHT_HTML_OPEN = "never"
$targets = @{ "API" = "http://localhost:4000/api/health"; "Shop" = "http://localhost:3000"; "Admin" = "http://localhost:5173" }

function Test-Up($url) { try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; $true } catch { if ($_.Exception.Response) { $true } else { $false } } }

if (-not (Test-Path "node_modules") -or -not (Test-Path "apps/e2e/node_modules")) {
  Write-Host ">> Cài phụ thuộc (pnpm install)"; pnpm install --frozen-lockfile; if ($LASTEXITCODE) { exit $LASTEXITCODE }
}
if (-not $Serve) { Write-Host ">> Đảm bảo có trình duyệt Chromium"; pnpm --filter "@farmery/e2e" exec playwright install chromium }

$proc = $null
$allUp = -not ($targets.Values | Where-Object { -not (Test-Up $_) })
if ($allUp) { Write-Host ">> Server đã chạy sẵn, dùng lại (không tắt khi xong)" }
else {
  Write-Host ">> Bật server (log: scripts/.demo-dev.log)"
  $log = Join-Path $PSScriptRoot ".demo-dev.log"
  $proc = Start-Process cmd -ArgumentList "/c", "pnpm dev > `"$log`" 2>&1" -WorkingDirectory $root -WindowStyle Hidden -PassThru
}
$code = 0
try {
  if (-not $allUp) {
    $deadline = (Get-Date).AddSeconds(240)
    foreach ($k in $targets.Keys) {
      Write-Host -NoNewline "   chờ $k "
      while (-not (Test-Up $targets[$k])) {
        if ((Get-Date) -gt $deadline) { throw "Hết giờ chờ $k — xem scripts/.demo-dev.log" }
        Start-Sleep -Seconds 2; Write-Host -NoNewline "."
      }
      Write-Host " sẵn sàng"
    }
  }
  if ($Serve) {
    Write-Host "`n== Prototype đang chạy ==`n  Shop:  http://localhost:3000`n  Admin: http://localhost:5173`n  API:   http://localhost:4000/docs`nNhấn Ctrl+C để tắt."
    while ($true) { Start-Sleep -Seconds 5 }
  } else {
    pnpm e2e; $code = $LASTEXITCODE
    Write-Host ("`n== Tóm tắt: e2e " + $(if ($code -eq 0) { "ĐẠT" } else { "CÓ CA HỎNG (mã $code)" }) + " — báo cáo: apps/e2e/playwright-report/index.html ==")
  }
} finally {
  if ($proc) { Write-Host ">> Tắt server"; taskkill /PID $proc.Id /T /F 2>&1 | Out-Null }
}
exit $code
