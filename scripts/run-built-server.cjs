const fs = require("fs");
const path = require("path");
const Module = module.constructor;

const target = path.resolve(__dirname, "..", "dist", "index.cjs");
const code = fs.readFileSync(target, "utf8");
const compiled = new Module(target, module.parent);

compiled.filename = target;
compiled.paths = Module._nodeModulePaths(path.dirname(target));
compiled._compile(code, target);
