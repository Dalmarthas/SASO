$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Niberium\Documents\GitHub\ASO Test'
$js = @"
const fs=require('fs');
const path=require('path');
const Module=module.constructor;
const target=path.resolve('dist/index.cjs');
const code=fs.readFileSync(target,'utf8');
const m=new Module(target,module.parent);
m.filename=target;
m.paths=Module._nodeModulePaths(path.dirname(target));
m._compile(code,target);
"@
& 'C:\Program Files\nodejs\node.exe' -e $js
