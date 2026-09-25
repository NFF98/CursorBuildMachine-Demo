import fs from "node:fs";

const errors=[];
const toolchain=JSON.parse(fs.readFileSync("tooling/TOOLCHAIN.json","utf8"));
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const current=JSON.parse(fs.readFileSync("build-spec/CURRENT.json","utf8"));
const ci=JSON.parse(fs.readFileSync("ci/policy.json","utf8"));

for(const [name,version] of Object.entries(toolchain.packages||{})){
  if(pkg.devDependencies?.[name]!==version) errors.push("Toolchain version mismatch "+name+": expected "+version+", got "+(pkg.devDependencies?.[name]||"MISSING"));
}
const scripts=[
  "check:types","check:lint","test:unit","test:contract","test:regression",
  "test:e2e","test:a11y","test:responsive","test:visual","security:audit",
  "product:ci","product:release-ci"
];
for(const name of scripts) if(!pkg.scripts?.[name]) errors.push("Missing toolchain script: "+name);

for(const file of ["tsconfig.json","eslint.config.mjs","vitest.config.ts","playwright.config.ts",".github/workflows/codeql.yml",".github/dependabot.yml"]){
  if(!fs.existsSync(file)) errors.push("Missing toolchain config: "+file);
}
if(current.implementation_enabled && ci.lockfile_required_when_implementation_enabled && !fs.existsSync("package-lock.json")){
  errors.push("Implementation enabled without package-lock.json");
}
if(pkg.devDependencies?.typescript?.startsWith("7.")){
  errors.push("TypeScript 7 is not approved while current typescript-eslint support is <6.1.0");
}
if(errors.length){
  console.error("TOOLCHAIN GATE: FAIL");
  errors.forEach(e=>console.error("- "+e));
  process.exit(1);
}
console.log("TOOLCHAIN GATE: PASS");
