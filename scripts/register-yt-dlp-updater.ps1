param(
  [string]$ScriptPath = (Join-Path $PSScriptRoot 'yt-dlp-updater.ps1'),
  [string]$TaskName = 'YtDlpUpdater',
  [string]$DailyTime = '03:15'
)

if (-not (Test-Path $ScriptPath)) { throw "Updater script not found: $ScriptPath" }
$timeSpan = [TimeSpan]::Parse($DailyTime)
$exe = 'powershell.exe'
$args = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$action = New-ScheduledTaskAction -Execute $exe -Argument $args
$trigger = New-ScheduledTaskTrigger -Daily -At ([datetime]::Today.Add($timeSpan))
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal
try {
  Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force
  Write-Output "Registered scheduled task '$TaskName' to run daily at $DailyTime"
} catch {
  Write-Output "Failed to register task '$TaskName': $($_.Exception.Message). Run elevated PowerShell."
}