Set WshShell = CreateObject("WScript.Shell")

' Get the script's directory
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Run the batch file completely hidden (0 = hidden, runs in background)
batchFile = scriptDir & "\Start-Warehouse.bat"
WshShell.Run """" & batchFile & """", 0, False

Set WshShell = Nothing
