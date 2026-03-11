$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Niberium\Documents\GitHub\ASO Test'
$env:NODE_ENV = 'development'
& 'C:\Program Files\nodejs\npm.cmd' exec tsx -- server/index.ts
