Set WshShell = CreateObject("WScript.Shell")

' Get the script's directory
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Run the stop batch file hidden
batchFile = scriptDir & "\Stop-Warehouse.bat"
WshShell.Run """" & batchFile & """", 0, True

' Show confirmation message
MsgBox "Warehouse Management System has been stopped.", vbInformation, "Warehouse System"

Set WshShell = Nothing
