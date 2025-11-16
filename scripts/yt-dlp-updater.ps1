param(
  [switch]$CheckOnly
)

function Get-Config {
  $default = [ordered]@{
    ytDlpPath = 'C:\Tools\yt-dlp\yt-dlp.exe'
    backupDir = "$env:ProgramData\yt-dlp-updater\backups"
    logDir = "$env:ProgramData\yt-dlp-updater\logs"
    stagingDir = "$env:ProgramData\yt-dlp-updater\staging"
    maxBackups = 3
    webhookUrl = $null
    validationUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    stopIfRunning = $true
  }
  $configPath = Join-Path $PSScriptRoot '..\config\yt-dlp-updater.json'
  if (Test-Path $configPath) {
    try {
      $c = Get-Content -Raw -Path $configPath | ConvertFrom-Json
      foreach ($k in $default.Keys) { if (-not $c.PSObject.Properties.Name.Contains($k)) { $c | Add-Member -NotePropertyName $k -NotePropertyValue $default[$k] } }
      return $c
    } catch {
      return (New-Object psobject -Property $default)
    }
  } else {
    return (New-Object psobject -Property $default)
  }
}

function Ensure-Dirs($paths) {
  foreach ($p in $paths) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null } }
}

function New-LogFile($dir) {
  $name = (Get-Date).ToString('yyyyMMdd') + '.log'
  return Join-Path $dir $name
}

function Write-Log($logFile, $level, $msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$level] $msg"
  Add-Content -Path $logFile -Value $line
  Write-Output $line
}

function Notify($webhookUrl, $title, $text, $success) {
  if (-not $webhookUrl) { return }
  try {
    $payload = @{ title = $title; message = $text; success = $success; timestamp = (Get-Date).ToString('o') }
    $json = $payload | ConvertTo-Json -Depth 3
    Invoke-RestMethod -Method Post -Uri $webhookUrl -Body $json -ContentType 'application/json' | Out-Null
  } catch {}
}

function Hash-File($path) {
  return (Get-FileHash -Path $path -Algorithm SHA256).Hash.ToLower()
}

function Get-LatestRelease() {
  $headers = @{ 'User-Agent' = 'Nomtok-yt-dlp-updater' }
  return Invoke-RestMethod -Uri 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest' -Headers $headers
}

function Find-Asset($release, $name) {
  foreach ($a in $release.assets) { if ($a.name -eq $name) { return $a } }
  return $null
}

function Compare-YtVersion($a, $b) {
  if (-not $a -or -not $b) { return 0 }
  $ap = $a -split '\.'
  $bp = $b -split '\.'
  for ($i=0; $i -lt [Math]::Max($ap.Length,$bp.Length); $i++) {
    $ai = if ($i -lt $ap.Length) { [int]$ap[$i] } else { 0 }
    $bi = if ($i -lt $bp.Length) { [int]$bp[$i] } else { 0 }
    if ($ai -gt $bi) { return 1 }
    if ($ai -lt $bi) { return -1 }
  }
  return 0
}

function Get-CurrentVersion($exe) {
  if (-not (Test-Path $exe)) { return $null }
  try { return (& $exe --version 2>$null).Trim() } catch { return $null }
}

function Is-YtRunning() {
  try { return (Get-Process -Name 'yt-dlp' -ErrorAction SilentlyContinue) -ne $null } catch { return $false }
}

function Rotate-Backups($backupDir, $maxBackups) {
  $files = Get-ChildItem -Path $backupDir -Filter 'yt-dlp-*.exe' | Sort-Object -Property LastWriteTime -Descending
  if ($files.Count -gt $maxBackups) { $files[$maxBackups..($files.Count-1)] | ForEach-Object { Remove-Item -Path $_.FullName -Force } }
}

function Validate-Exe($exePath, $validationUrl) {
  try {
    $v = (& $exePath --version 2>&1)
    if (-not $v) { return $false }
    if ($validationUrl) {
      $res = & $exePath $validationUrl --skip-download --simulate 2>&1
      if ($LASTEXITCODE -ne 0) { return $false }
    }
    return $true
  } catch { return $false }
}

function Update-YtDlp($cfg, $logFile) {
  Write-Log $logFile 'INFO' 'Starting yt-dlp update check'
  Ensure-Dirs @($cfg.logDir, $cfg.backupDir, $cfg.stagingDir)
  if ($cfg.stopIfRunning -and (Is-YtRunning)) {
    Write-Log $logFile 'WARN' 'yt-dlp is currently running; skipping update'
    return $false
  }
  $curVer = Get-CurrentVersion $cfg.ytDlpPath
  $rel = Get-LatestRelease
  $latestTag = $rel.tag_name
  $curStr = if ($curVer) { $curVer } else { 'none' }
  Write-Log $logFile 'INFO' ("Current version: $curStr, Latest: $latestTag")
  if ($curVer -and (Compare-YtVersion $latestTag $curVer) -le 0) {
    Write-Log $logFile 'INFO' 'Already up to date'
    return $true
  }
  $asset = Find-Asset $rel 'yt-dlp.exe'
  if (-not $asset) {
    Write-Log $logFile 'ERROR' 'yt-dlp.exe asset not found in latest release'
    Notify $cfg.webhookUrl 'yt-dlp update failed' 'Asset not found' $false
    return $false
  }
  $shaAsset = Find-Asset $rel 'SHA256SUMS'
  $downloadPath = Join-Path $cfg.stagingDir ("yt-dlp-$latestTag.exe")
  try {
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath -UseBasicParsing
  } catch {
    Write-Log $logFile 'ERROR' ("Download failed: " + $_.Exception.Message)
    Notify $cfg.webhookUrl 'yt-dlp update failed' 'Download error' $false
    return $false
  }
  $expectedHash = $null
  if ($shaAsset) {
    try {
      $shaFile = Join-Path $cfg.stagingDir ("SHA256SUMS-$latestTag.txt")
      Invoke-WebRequest -Uri $shaAsset.browser_download_url -OutFile $shaFile -UseBasicParsing
      $line = Select-String -Path $shaFile -Pattern 'yt-dlp.exe' | Select-Object -First 1
      if ($line) { $expectedHash = ($line.Line -split '\s+')[0].ToLower() }
    } catch {}
  }
  $actualHash = Hash-File $downloadPath
  if ($expectedHash -and ($expectedHash -ne $actualHash)) {
    Write-Log $logFile 'ERROR' 'Checksum mismatch'
    Remove-Item -Path $downloadPath -Force
    Notify $cfg.webhookUrl 'yt-dlp update failed' 'Checksum mismatch' $false
    return $false
  }
  if (-not (Validate-Exe $downloadPath $cfg.validationUrl)) {
    Write-Log $logFile 'ERROR' 'Validation failed for downloaded executable'
    Remove-Item -Path $downloadPath -Force
    Notify $cfg.webhookUrl 'yt-dlp update failed' 'Pre-install validation failed' $false
    return $false
  }
  if ($CheckOnly) {
    Write-Log $logFile 'INFO' 'CheckOnly enabled; skipping installation'
    return $true
  }
  try {
    if (Test-Path $cfg.ytDlpPath) {
      $curVerSafe = $curVer
      if (-not $curVerSafe) { $curVerSafe = (Get-Date).ToString('yyyyMMddHHmmss') }
      $backupPath = Join-Path $cfg.backupDir ("yt-dlp-$curVerSafe.exe")
      Copy-Item -Path $cfg.ytDlpPath -Destination $backupPath -Force
      Rotate-Backups $cfg.backupDir $cfg.maxBackups
    }
    $targetDir = Split-Path -Path $cfg.ytDlpPath -Parent
    Ensure-Dirs @($targetDir)
    $tempNew = Join-Path $targetDir ("yt-dlp.new.exe")
    Copy-Item -Path $downloadPath -Destination $tempNew -Force
    Move-Item -Path $tempNew -Destination $cfg.ytDlpPath -Force
  } catch {
    Write-Log $logFile 'ERROR' ("Install failed: " + $_.Exception.Message)
    Notify $cfg.webhookUrl 'yt-dlp update failed' 'Install error' $false
    return $false
  }
  if (-not (Validate-Exe $cfg.ytDlpPath $cfg.validationUrl)) {
    try {
      $lastBackup = Get-ChildItem -Path $cfg.backupDir -Filter 'yt-dlp-*.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
      if ($lastBackup) { Copy-Item -Path $lastBackup.FullName -Destination $cfg.ytDlpPath -Force }
      Write-Log $logFile 'ERROR' 'Post-install validation failed; rolled back'
      Notify $cfg.webhookUrl 'yt-dlp update failed' 'Post-install validation failed; rolled back' $false
      return $false
    } catch {
      Write-Log $logFile 'ERROR' 'Rollback failed'
      Notify $cfg.webhookUrl 'yt-dlp update failed' 'Rollback failed' $false
      return $false
    }
  }
  Write-Log $logFile 'INFO' ("Update successful to version $latestTag")
  Notify $cfg.webhookUrl 'yt-dlp updated' ("Updated to $latestTag") $true
  try { Remove-Item -Path $downloadPath -Force } catch {}
  return $true
}

$cfg = Get-Config
Ensure-Dirs @($cfg.logDir, $cfg.backupDir, $cfg.stagingDir)
$logFile = New-LogFile $cfg.logDir
try {
  $res = Update-YtDlp $cfg $logFile
  if ($res) { exit 0 } else { exit 1 }
} catch {
  Write-Log $logFile 'ERROR' $_.Exception.Message
  Notify $cfg.webhookUrl 'yt-dlp update failed' 'Unhandled error' $false
  exit 1
}