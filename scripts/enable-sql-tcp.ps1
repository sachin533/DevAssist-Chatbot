# One-time SQL Server Express network setup — MUST run as Administrator.
# Enables TCP/IP (static port 1433) + Mixed Mode auth, restarts SQLEXPRESS,
# creates the PhonebookDB SQL login, and applies the schema.
# Usage (elevated PowerShell): powershell -ExecutionPolicy Bypass -File scripts\enable-sql-tcp.ps1

$ErrorActionPreference = 'Stop'
$log = Join-Path $env:TEMP 'sql-tcp-setup.log'
function Log($m) { $m | Tee-Object -FilePath $log -Append }

try {
  $tcp = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp'
  Set-ItemProperty $tcp -Name Enabled -Value 1
  Get-ChildItem $tcp | Where-Object { $_.PSChildName -like 'IP*' -and $_.PSChildName -ne 'IPAll' } |
    ForEach-Object { Set-ItemProperty $_.PSPath -Name Enabled -Value 1 }
  Set-ItemProperty "$tcp\IPAll" -Name TcpPort -Value '1433'
  Set-ItemProperty "$tcp\IPAll" -Name TcpDynamicPorts -Value ''
  Log 'TCP/IP enabled on static port 1433.'

  Set-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer' -Name LoginMode -Value 2
  Log 'Mixed Mode authentication enabled.'

  Restart-Service 'MSSQL$SQLEXPRESS' -Force
  Start-Sleep -Seconds 10
  Log ("Service status: " + (Get-Service 'MSSQL$SQLEXPRESS').Status)

  $pwd = 'Ph0nebook!Local123'
  $setupSql = @"
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'phonebook_user')
  CREATE LOGIN [phonebook_user] WITH PASSWORD = N'$pwd', CHECK_POLICY = OFF;
"@
  $setupSql | sqlcmd -S '.\SQLEXPRESS' -E -b
  Log 'SQL login phonebook_user ensured.'

  $root = Split-Path $PSScriptRoot -Parent
  sqlcmd -S '.\SQLEXPRESS' -E -b -i (Join-Path $root 'sql\schema.sql')
  Log 'schema.sql applied.'

  $grantSql = @"
USE PhonebookDB;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'phonebook_user')
  CREATE USER [phonebook_user] FOR LOGIN [phonebook_user];
ALTER ROLE [db_owner] ADD MEMBER [phonebook_user];
"@
  $grantSql | sqlcmd -S '.\SQLEXPRESS' -E -b
  Log 'phonebook_user mapped to PhonebookDB as db_owner.'

  sqlcmd -S 'localhost,1433' -U phonebook_user -P $pwd -d PhonebookDB -Q 'SELECT TOP (1) Id FROM dbo.Contacts' -b
  Log 'TCP + SQL-auth verification query SUCCEEDED.'
  Log 'SETUP_OK'
} catch {
  Log ("SETUP_FAILED: " + $_.Exception.Message)
  exit 1
}
