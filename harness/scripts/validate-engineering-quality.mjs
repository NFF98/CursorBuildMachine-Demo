import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), errors=[];
const policy=JSON.parse(fs.readFileSync(path.join(root,"harness/policy/engineering-quality.json"),"utf8"));
const roots=["src","tests","generated"];
const files=[];
const walk=dir=>{
  if(!fs.existsSync(dir)) return;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else if(/\.(?:ts|tsx|js|mjs|cjs)$/.test(ent.name)) files.push(p);
  }
};
for(const d of roots) walk(path.join(root,d));
for(const abs of files){
  const rel=path.relative(root,abs).replaceAll("\\","/");
  const text=fs.readFileSync(abs,"utf8");
  for(const token of policy.static_policy.forbid_typescript_escape_hatches||[]){
    if(text.includes(token)) errors.push(rel+" forbidden escape hatch: "+token);
  }
  if(rel.startsWith("tests/")){
    for(const token of policy.static_policy.forbid_test_modifiers||[]){
      if(text.includes(token)) errors.push(rel+" forbidden test modifier: "+token);
    }
    for(const token of policy.static_policy.forbid_obvious_fake_assertions||[]){
      if(text.replaceAll(/\s+/g,"").includes(token.replaceAll(/\s+/g,""))) errors.push(rel+" obvious fake assertion: "+token);
    }
  }
}
if(errors.length){console.error("ENGINEERING QUALITY GATE: FAIL");errors.forEach(e=>console.error("- "+e));process.exit(1);}
console.log("ENGINEERING QUALITY GATE: PASS");
