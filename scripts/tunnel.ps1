# scripts/tunnel.ps1 - Persistent localhost.run reverse tunnel
$envFile = Join-Path $PSScriptRoot "..\.env.local"

while ($true) {
  Write-Host "[tunnel] Starting SSH tunnel to localhost.run..."
  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = "ssh"
  $processInfo.Arguments = "-o StrictHostKeyChecking=no -o ServerAliveInterval=10 -o ServerAliveCountMax=60 -R 80:localhost:3000 nokey@localhost.run"
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true
  $processInfo.UseShellExecute = $false
  $processInfo.CreateNoWindow = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $processInfo
  $process.Start() | Out-Null

  $tunnelUrl = $null
  while (-not $process.HasExited) {
    $line = $process.StandardOutput.ReadLine()
    if ($line) {
      Write-Host "[tunnel-out] $line"
      if ($line -match "(https://[a-zA-Z0-9]+\.lhr\.life)") {
        $tunnelUrl = $matches[1]
        Write-Host "=========================================="
        Write-Host "[tunnel] ACTIVE PUBLIC URL: $tunnelUrl"
        Write-Host "=========================================="
        if (Test-Path $envFile) {
          $content = Get-Content $envFile -Raw
          $updated = $content -replace "NEXT_PUBLIC_APP_URL=https?://[^\r\n]+", "NEXT_PUBLIC_APP_URL=$tunnelUrl"
          Set-Content -Path $envFile -Value $updated -NoNewline
          Write-Host "[tunnel] Updated .env.local with $tunnelUrl"
        }
      }
    }
  }

  Write-Warning "[tunnel] Connection dropped. Reconnecting in 3 seconds..."
  Start-Sleep -Seconds 3
}

