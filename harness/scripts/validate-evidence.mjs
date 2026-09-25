import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), errors=[];
const dir=path.join(root,"delivery/evidence");
const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith(".json")):[];
const kinds=new Set(["TEST_RESULT","COMMAND_RESULT","REVIEW","SCREENSHOT","VISUAL_DIFF","ACCESSIBILITY","BUILD_ARTIFACT","DEPLOYMENT","RUNTIME_TRACE"]);
const statuses=new Set(["PASS","FAIL","INFO"]);
const seen=new Set(), evidence=new Map();

for(const file of files){
  const e=JSON.parse(fs.readFileSync(path.join(dir,file),"utf8"));
  if(!/^EV-SP-P\d+-\d{3}-T\d{3}-\d{3}$/.test(e.evidence_id||"")) errors.push("Invalid evidence_id: "+file);
  if(file!==e.evidence_id+".json") errors.push("Evidence filename must equal evidence_id: "+file);
  if(seen.has(e.evidence_id)) errors.push("Duplicate evidence_id: "+e.evidence_id); seen.add(e.evidence_id);
  if(!kinds.has(e.kind)) errors.push(e.evidence_id+" invalid kind");
  if(!statuses.has(e.status)) errors.push(e.evidence_id+" invalid status");
  for(const k of ["build_spec_id","sprint_id","task_id","locator","recorded_at"]) if(!e[k]) errors.push(e.evidence_id+" missing "+k);
  if(e.sha256!==null && !/^[0-9a-f]{64}$/.test(e.sha256||"")) errors.push(e.evidence_id+" invalid sha256");
  evidence.set(e.evidence_id,e);
}

const sprintRoot=path.join(root,"delivery/sprints");
if(fs.existsSync(sprintRoot)) for(const s of fs.readdirSync(sprintRoot,{withFileTypes:true}).filter(x=>x.isDirectory())){
  const tp=path.join(sprintRoot,s.name,"tasks.json");
  if(!fs.existsSync(tp)) continue;
  const td=JSON.parse(fs.readFileSync(tp,"utf8"));
  for(const t of td.tasks||[]){
    if(["VERIFIED","CLOSED"].includes(t.status) && (!Array.isArray(t.completion_evidence)||!t.completion_evidence.length)) errors.push(s.name+"/"+t.task_id+" verified/closed without evidence");
    for(const eid of t.completion_evidence||[]){
      const e=evidence.get(eid);
      if(!e) errors.push(s.name+"/"+t.task_id+" references missing evidence "+eid);
      else if(e.sprint_id!==s.name || e.task_id!==t.task_id || e.build_spec_id!==t.build_spec_id) errors.push(eid+" binding mismatch");
    }
  }
}

if(errors.length){console.error("EVIDENCE GATE: FAIL");errors.forEach(e=>console.error("- "+e));process.exit(1);}
console.log("EVIDENCE GATE: PASS");
