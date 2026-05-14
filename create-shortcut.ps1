$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = "C:\Users\KUMAR\OneDrive\Desktop"
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Evidence Automator.lnk")
$Shortcut.TargetPath = "C:\Users\KUMAR\PCE-Primary-Check-Evidence-Tool\start-app.bat"
$Shortcut.WorkingDirectory = "C:\Users\KUMAR\PCE-Primary-Check-Evidence-Tool"
$Shortcut.Description = "Start Evidence Automator (Frontend & Backend)"
$Shortcut.IconLocation = "cmd.exe"
$Shortcut.Save()
Write-Host "✅ Shortcut created on your Desktop at $DesktopPath"
