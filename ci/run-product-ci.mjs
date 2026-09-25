import fs from "node:fs";
import { spawnSync } from "node:child_process";

const current=JSON.parse(fs.readFileSync("build-spec/CURRENT.json","utf8"));
const policy=JSON.parse(fs.readFileSync("ci/policy.json","utf8"));
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

if(!current.implementation_enabled){
  console.log("PRODUCT CI: HOLD — implementation not enabled.");
  process.exit(0);
}
if(policy.lockfile_required_when_implementation_enabled && !fs.existsSync("package-lock.json")){
  console.error("PRODUCT CI: FAIL\n- package-lock.json is required once implementation is enabled.");
  process.exit(1);
}

const missing=(policy.required_when_implementation_enabled||[]).filter(s=>!pkg.scripts?.[s]);
if(missing.length){
  console.error("PRODUCT CI: FAIL");
  missing.forEach(s=>console.error("- Missing required npm script: "+s));
  process.exit(1);
}
for(const script of policy.required_when_implementation_enabled){
  console.log("\n> npm run "+script);
  const r=spawnSync("npm",["run",script],{stdio:"inherit",shell:false});
  if(r.status!==0) process.exit(r.status||1);
}
console.log("PRODUCT CI: PASS");
