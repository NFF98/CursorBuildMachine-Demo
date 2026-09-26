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
  "test:e2e","test:a11y","test:responsive","test:visual","security:audit","build",
  "gate:test-integrity","gate:engineering-quality","product:ci","product:release-ci"
];
for(const name of scripts) if(!pkg.scripts?.[name]) errors.push("Missing toolchain script: "+name);

for(const file of ["tsconfig.json","tsconfig.build.json","eslint.config.mjs","vitest.config.ts","playwright.config.ts",".github/workflows/codeql.yml",".github/dependabot.yml"]){
  if(!fs.existsSync(file)) errors.push("Missing toolchain config: "+file);
}
const holdExceptions=new Set(JSON.parse(fs.readFileSync("harness/policy/repo-policy.json","utf8")).hold_exceptions||[]);
const hasRealImplementation=()=>{
  const roots=["src","tests","generated","supabase"];
  const walk=dir=>{
    if(!fs.existsSync(dir)) return false;
    for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
      const p=dir+"/"+ent.name;
      if(ent.isDirectory()){ if(walk(p)) return true; }
      else if(!holdExceptions.has(p)) return true;
    }
    return false;
  };
  return roots.some(walk);
};
if(current.implementation_enabled && ci.lockfile_required_when_implementation_enabled && !fs.existsSync("package-lock.json") && hasRealImplementation()){
  errors.push("Real implementation exists without package-lock.json");
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
