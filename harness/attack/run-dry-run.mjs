import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const source=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"cursor-build-machine-attack-"));
const repo=path.join(tmp,"repo");
const results=[];

const run=(cmd,args,{cwd=repo,env={}}={})=>{
  const r=spawnSync(cmd,args,{cwd,encoding:"utf8",env:{...process.env,...env}});
  return {status:r.status??1,stdout:r.stdout||"",stderr:r.stderr||""};
};
const must=(cond,msg)=>{if(!cond) throw new Error(msg);};
const write=(rel,data)=>{
  const p=path.join(repo,rel); fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,typeof data==="string"?data:JSON.stringify(data,null,2)+"\n");
};
const read=rel=>JSON.parse(fs.readFileSync(path.join(repo,rel),"utf8"));
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const fileSha=p=>crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const git=(...args)=>run("git",args);
const commit=msg=>{must(git("add",".").status===0,"git add failed"); const r=git("commit","-m",msg); must(r.status===0,"git commit failed: "+r.stderr); return git("rev-parse","HEAD").stdout.trim();};
const cleanTo=ref=>{must(git("reset","--hard",ref).status===0,"git reset failed"); git("clean","-fd");};

fs.cpSync(source,repo,{recursive:true,filter:p=>!p.includes(path.sep+".git")&&!p.includes(path.sep+"node_modules")&&!p.includes(path.sep+".attack-dry-run")});
must(git("init","-b","main").status===0,"git init failed");
git("config","user.name","Cursor Build Machine Attack Dry Run");
git("config","user.email","attack@example.invalid");

function makeBaseline(id,{sourceCommit,supersedes=null,deltas=[],decisionRef}){
  const base="build-spec/baselines/"+id;
  write(base+"/functions/demo.md","# Fake Build Contract\n\nDeterministic demo contract.\n");
  write(base+"/registries/acceptance-test-registry.json",{
    schema_version:1,total_acceptance:1,
    entries:[{acceptance_id:"F99-AC-001",test_id:"TEST-F99-001",contract_status:"READY_FOR_IMPLEMENTATION"}]
  });
  const rels=["functions/demo.md","registries/acceptance-test-registry.json"].sort();
  const inventory=rels.map(rel=>({path:rel,sha256:fileSha(path.join(repo,base,rel))}));
  const aggregate=sha(inventory.map(x=>x.path+":"+x.sha256+"\n").join(""));
  write(base+"/manifest.json",{
    schema_version:1,baseline_id:id,status:"LOCKED",source_repo:read("harness/policy/repo-policy.json").design_source_repo,
    source_working_commit:sourceCommit,created_at:"2026-09-24T00:00:00Z",
    supersedes,approved_delta_ids:deltas,
    approval:{status:"USER_APPROVED",decision_ref:decisionRef},
    acceptance_registry:"registries/acceptance-test-registry.json",acceptance_count:1,
    file_inventory:inventory,content_sha256:aggregate
  });
}
function makeActivation(id,{previous=null,type,sourceCommit,deltas=[],decisionRef}){
  write("build-spec/activations/"+id+".json",{
    schema_version:1,baseline_id:id,previous_baseline:previous,type,status:"USER_APPROVED",
    decision_ref:decisionRef,approved_delta_ids:deltas,source_working_commit:sourceCommit,
    activated_at:"2026-09-24T00:00:00Z"
  });
}
function baseWorkState(id,status="ACTIVE",taskStatus="IN_PROGRESS"){
  write("build-spec/CURRENT.json",{schema_version:1,active_baseline:id,implementation_enabled:true,reason:"ATTACK_DRY_RUN"});
  write("delivery/backlog/QUEUE.json",{schema_version:1,build_spec_id:id,status:"OPEN",items:[{
    backlog_item_id:"BL-P9-001",source:"BUILD_SPEC",build_spec_id:id,function_id:"F99",title:"Fake task",
    status:"SPRINTED",priority:"P0",scope_contracts:["functions/demo.md"],
    acceptance_links:[{acceptance_id:"F99-AC-001",test_id:"TEST-F99-001",test_family:"behavior"}],
    dependencies:[],sprint_id:"SP-P9-001",product_decision_allowed:false
  }]});
  write("delivery/CURRENT-SPRINT.json",{
    schema_version:1,active_sprint:"SP-P9-001",active_build_spec:id,active_task:"T001",
    status,automation_mode:"SAFE_AUTOMATION",reason:"ATTACK_DRY_RUN"
  });
  write("delivery/sprints/SP-P9-001/manifest.json",{
    schema_version:1,sprint_id:"SP-P9-001",build_spec_id:id,status,
    entry_gate:{build_spec_locked:true,baseline_gate_passed:true,acceptance_mapped:true,user_approved:true,approval_ref:"DRYRUN-SPRINT"}
  });
  write("delivery/sprints/SP-P9-001/tasks.json",{schema_version:3,sprint_id:"SP-P9-001",tasks:[{
    task_id:"T001",backlog_item_ids:["BL-P9-001"],title:"Fake task",status:taskStatus,build_spec_id:id,
    scope:["fake"],non_scope:[],acceptance_links:[{acceptance_id:"F99-AC-001",test_id:"TEST-F99-001"}],
    allowed_write_paths:["src/demo/","tests/behavior/"],required_commands:["npm run gate"],
    required_skills:["implementer","test-builder","reviewer"],parallel_safe:false,product_decision_allowed:false,
    blocked_by:[],completion_evidence:[]
  }]});
}
function expectFail(name,script,{base,head="HEAD"}={}){
  const env={}; if(base) env.BASE_SHA=base; if(head) env.HEAD_SHA=head;
  const r=run("node",[script],{env});
  const pass=r.status!==0;
  results.push({name,expected:"FAIL",actual:pass?"FAIL":"PASS",ok:pass,detail:(r.stderr||r.stdout).trim().split("\n").slice(0,4).join(" | ")});
  if(!pass) throw new Error("Attack unexpectedly passed: "+name+"\n"+r.stdout+"\n"+r.stderr);
}
function expectPass(name,cmd,args,{base,head="HEAD"}={}){
  const env={}; if(base) env.BASE_SHA=base; if(head) env.HEAD_SHA=head;
  const r=run(cmd,args,{env});
  const pass=r.status===0;
  results.push({name,expected:"PASS",actual:pass?"PASS":"FAIL",ok:pass,detail:(r.stderr||r.stdout).trim().split("\n").slice(0,4).join(" | ")});
  if(!pass) throw new Error("Positive case failed: "+name+"\n"+r.stdout+"\n"+r.stderr);
}
function expectHarnessPass(name,scripts,{base,head="HEAD"}={}){
  for(const script of scripts) expectPass(name+" :: "+path.basename(script),"node",[script],{base,head});
}
const governanceHarness=[
  "harness/scripts/validate-baseline.mjs",
  "harness/scripts/governance-gate.mjs",
  "harness/scripts/validate-activation.mjs",
  "harness/scripts/validate-backlog.mjs",
  "harness/scripts/validate-sprint.mjs",
  "harness/scripts/validate-findings.mjs",
  "harness/scripts/validate-evidence.mjs",
  "harness/scripts/validate-release.mjs",
  "harness/scripts/validate-change-scope.mjs"
];

const sourceA="a".repeat(40), sourceB="b".repeat(40);
makeBaseline("BS-P9-001",{sourceCommit:sourceA,decisionRef:"DRYRUN-INITIAL"});
makeActivation("BS-P9-001",{type:"INITIAL_FREEZE",sourceCommit:sourceA,decisionRef:"DRYRUN-INITIAL"});
baseWorkState("BS-P9-001");
write("package-lock.json",{name:"cursor-build-machine",version:"0.0.0",lockfileVersion:3,requires:true,packages:{"":{name:"cursor-build-machine",version:"0.0.0"}}});
const fixtureBase=commit("fixture: valid active sprint");
expectHarnessPass("valid fixture baseline",governanceHarness,{});

write("src/outside/hack.ts","export const hack=true;\n");
const outside=commit("attack: write outside task allowlist");
expectFail("Task allowlist blocks out-of-scope source","harness/scripts/validate-change-scope.mjs",{base:fixtureBase,head:outside});
cleanTo(fixtureBase);

write("build-spec/baselines/BS-P9-001/functions/demo.md","# hacked locked contract\n");
const mutate=commit("attack: mutate locked baseline");
expectFail("Locked Build Spec byte mutation","harness/scripts/governance-gate.mjs",{base:fixtureBase,head:mutate});
cleanTo(fixtureBase);

makeBaseline("BS-P9-002",{sourceCommit:sourceB,supersedes:"BS-P9-001",deltas:["BD-999"],decisionRef:"FAKE"});
write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-002",implementation_enabled:true,reason:"ATTACK"});
const pointer=commit("attack: switch current without activation");
expectFail("CURRENT pointer cannot switch without Activation Record","harness/scripts/validate-activation.mjs",{base:fixtureBase,head:pointer});
cleanTo(fixtureBase);

write("delivery/findings/BF-901.json",{
  schema_version:1,finding_id:"BF-901",classification:"DESIGN_DELTA_CANDIDATE",status:"BLOCKED",
  build_spec_id:"BS-P9-001",sprint_id:"SP-P9-001",task_id:"T001",expected:"A",actual:"B",
  evidence:["dry-run"],attempts:[],contract_affecting:true,delta_id:"BD-901"
});
write("delivery/deltas/BD-901.json",{
  schema_version:1,delta_id:"BD-901",type:"DESIGN_DELTA",status:"APPROVED",source_finding_ids:["BF-901"],
  affected_build_spec:"BS-P9-001",affected_tasks:["T001"],affected_contracts:[],affected_acceptance:[],
  changes_contract_semantics:true,owner:"CURSOR",user_decision_required:true,
  user_decision:{status:"APPROVED",decision_ref:"FORGED"},replacement_build_spec_required:true,
  upstream_working_commit:sourceB,replacement_build_spec:null,verification:[]
});
const fakeDelta=commit("attack: cursor self approves design delta");
expectFail("Cursor-owned DESIGN_DELTA is rejected","harness/scripts/validate-findings.mjs",{base:fixtureBase,head:fakeDelta});
cleanTo(fixtureBase);

baseWorkState("BS-P9-001","BLOCKED","BLOCKED");
write("src/demo/blocked.ts","export const blocked=true;\n");
const blockedWrite=commit("attack: blocked sprint writes code");
expectFail("BLOCKED Sprint cannot write implementation","harness/scripts/validate-change-scope.mjs",{base:fixtureBase,head:blockedWrite});
cleanTo(fixtureBase);

write("delivery/findings/BF-902.json",{
  schema_version:1,finding_id:"BF-902",classification:"IMPLEMENTATION_BUG",status:"OPEN",
  build_spec_id:"BS-P9-001",sprint_id:"SP-P9-001",task_id:"T001",expected:"pass",actual:"fail",
  evidence:["dry-run"],contract_affecting:false,delta_id:null,
  attempts:[
    {attempt_id:"A1",strategy:"same-fix",result:"FAIL",evidence:"e1"},
    {attempt_id:"A2",strategy:"same-fix",result:"FAIL",evidence:"e2"},
    {attempt_id:"A3",strategy:"same-fix",result:"FAIL",evidence:"e3"}
  ]
});
const retry=commit("attack: third same strategy retry");
expectFail("Third same-strategy retry is rejected","harness/scripts/validate-findings.mjs",{base:fixtureBase,head:retry});
cleanTo(fixtureBase);

write("releases/manifests/REL-P9-001.json",{
  schema_version:1,release_id:"REL-P9-001",status:"RELEASE_READY",build_spec_id:"BS-P9-001",
  source_commit:"c".repeat(40),sprint_ids:["SP-P9-001"],
  approval:{status:"PENDING",decision_ref:null},
  targets:[{target_id:"web",type:"CLOUDFLARE_PAGES",enabled:true,artifact_path:"dist"}],
  health_checks:[{name:"root",base_url_env:"DEPLOY_BASE_URL",path:"/",expected_status:[200]}],
  rollback:{cloudflare_code_auto:true,database_auto:false,database_strategy:"FORWARD_ONLY"}
});
const release=commit("attack: unapproved release");
expectFail("Unapproved Release is rejected","harness/scripts/validate-release.mjs",{base:fixtureBase,head:release});
cleanTo(fixtureBase);

write("delivery/CURRENT-SPRINT.json",{schema_version:1,active_sprint:null,active_build_spec:null,active_task:null,status:"HOLD",automation_mode:"SAFE_AUTOMATION",reason:"ATTACK"});
write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-001",implementation_enabled:false,reason:"ATTACK"});
write("src/demo/hold.ts","export const hold=true;\n");
const holdWrite=commit("attack: hold writes implementation");
expectFail("HOLD cannot write product implementation","harness/scripts/validate-change-scope.mjs",{base:fixtureBase,head:holdWrite});
cleanTo(fixtureBase);

baseWorkState("BS-P9-001","BLOCKED","BLOCKED");
write("delivery/findings/BF-999.json",{
  schema_version:1,finding_id:"BF-999",classification:"DESIGN_DELTA_CANDIDATE",status:"BLOCKED",
  build_spec_id:"BS-P9-001",sprint_id:"SP-P9-001",task_id:"T001",expected:"old",actual:"needs approved change",
  evidence:["dry-run"],attempts:[],contract_affecting:true,delta_id:"BD-999"
});
write("delivery/deltas/BD-999.json",{
  schema_version:1,delta_id:"BD-999",type:"DESIGN_DELTA",status:"APPROVED",source_finding_ids:["BF-999"],
  affected_build_spec:"BS-P9-001",affected_tasks:["T001"],affected_contracts:["functions/demo.md"],affected_acceptance:["F99-AC-001"],
  changes_contract_semantics:true,owner:"HUMAN_GOVERNANCE",user_decision_required:true,
  user_decision:{status:"APPROVED",decision_ref:"DRYRUN-DELTA-APPROVAL"},replacement_build_spec_required:true,
  upstream_working_commit:sourceB,replacement_build_spec:"BS-P9-002",verification:[]
});
const blockedBase=commit("fixture: blocked for approved design delta");

makeBaseline("BS-P9-002",{sourceCommit:sourceB,supersedes:"BS-P9-001",deltas:["BD-999"],decisionRef:"DRYRUN-REBASELINE"});
makeActivation("BS-P9-002",{previous:"BS-P9-001",type:"REBASELINE",sourceCommit:sourceB,deltas:["BD-999"],decisionRef:"DRYRUN-REBASELINE"});
baseWorkState("BS-P9-002","BLOCKED","BLOCKED");
const resolved=read("delivery/findings/BF-999.json"); resolved.status="RESOLVED"; write("delivery/findings/BF-999.json",resolved);
write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-002",implementation_enabled:true,reason:"APPROVED_DRYRUN_REBASELINE"});
const goodRebaseline=commit("positive: approved rebaseline remains blocked");
expectHarnessPass("Approved rebaseline transition",governanceHarness,{base:blockedBase,head:goodRebaseline});

// Positive Sprint Activation transition: only the four state-control files may cross HOLD -> ACTIVE.
cleanTo(fixtureBase);
write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-001",implementation_enabled:false,reason:"DRYRUN_PLANNED"});
write("delivery/CURRENT-SPRINT.json",{schema_version:1,active_sprint:null,active_build_spec:null,active_task:null,status:"HOLD",automation_mode:"SAFE_AUTOMATION",reason:"DRYRUN_PLANNED"});
const plannedManifest=read("delivery/sprints/SP-P9-001/manifest.json");
plannedManifest.status="PLANNED";
plannedManifest.entry_gate.user_approved=false;
plannedManifest.entry_gate.approval_ref=null;
write("delivery/sprints/SP-P9-001/manifest.json",plannedManifest);
const plannedTasks=read("delivery/sprints/SP-P9-001/tasks.json");
plannedTasks.tasks[0].status="PLANNED";
write("delivery/sprints/SP-P9-001/tasks.json",plannedTasks);
const activationBase=commit("fixture: planned sprint awaiting activation");

write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-001",implementation_enabled:true,reason:"DRYRUN_APPROVED_ACTIVATION"});
const activeManifest=read("delivery/sprints/SP-P9-001/manifest.json");
activeManifest.status="ACTIVE";
activeManifest.entry_gate.user_approved=true;
activeManifest.entry_gate.approval_ref="DRYRUN-SPRINT-ACTIVATION";
write("delivery/sprints/SP-P9-001/manifest.json",activeManifest);
const activeTasks=read("delivery/sprints/SP-P9-001/tasks.json");
activeTasks.tasks[0].status="IN_PROGRESS";
write("delivery/sprints/SP-P9-001/tasks.json",activeTasks);
write("delivery/CURRENT-SPRINT.json",{
  schema_version:1,active_sprint:"SP-P9-001",active_build_spec:"BS-P9-001",active_task:"T001",
  status:"ACTIVE",automation_mode:"SAFE_AUTOMATION",reason:"DRYRUN_APPROVED_ACTIVATION"
});
const activationHead=commit("positive: approved sprint activation");
expectPass("Approved Sprint Activation transition","node",["harness/scripts/validate-change-scope.mjs"],{base:activationBase,head:activationHead});

cleanTo(activationBase);
write("build-spec/CURRENT.json",{schema_version:1,active_baseline:"BS-P9-001",implementation_enabled:true,reason:"DRYRUN_APPROVED_ACTIVATION"});
const maliciousManifest=read("delivery/sprints/SP-P9-001/manifest.json");
maliciousManifest.status="ACTIVE";
maliciousManifest.entry_gate.user_approved=true;
maliciousManifest.entry_gate.approval_ref="DRYRUN-SPRINT-ACTIVATION";
write("delivery/sprints/SP-P9-001/manifest.json",maliciousManifest);
const maliciousTasks=read("delivery/sprints/SP-P9-001/tasks.json");
maliciousTasks.tasks[0].status="IN_PROGRESS";
write("delivery/sprints/SP-P9-001/tasks.json",maliciousTasks);
write("delivery/CURRENT-SPRINT.json",{
  schema_version:1,active_sprint:"SP-P9-001",active_build_spec:"BS-P9-001",active_task:"T001",
  status:"ACTIVE",automation_mode:"SAFE_AUTOMATION",reason:"DRYRUN_APPROVED_ACTIVATION"
});
write("harness/unauthorized-during-activation.txt","must remain blocked\n");
const maliciousActivation=commit("attack: activation edits unrelated governance");
expectFail("Sprint Activation cannot smuggle unrelated governance edits","harness/scripts/validate-change-scope.mjs",{base:activationBase,head:maliciousActivation});

const passed=results.filter(x=>x.ok).length;
console.log("\nATTACK DRY-RUN RESULT: "+passed+"/"+results.length+" expected outcomes observed");
for(const r of results) console.log((r.ok?"PASS":"FAIL")+" | "+r.name+" | expected "+r.expected+" got "+r.actual);
if(passed!==results.length) process.exit(1);
