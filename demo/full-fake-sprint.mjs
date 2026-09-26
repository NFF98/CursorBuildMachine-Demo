import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";

const source=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"cursor-build-machine-full-e2e-"));
const results=[];
const BS="BS-P9-901", SP="SP-P9-901", TASK="T001", BL="BL-P9-901", AC="F99-AC-001", TEST="TEST-F99-001";
const NOW="2026-09-26T00:00:00Z";
const SOURCE_COMMIT="1".repeat(40);

const p=(...xs)=>path.join(tmp,...xs);
const write=(rel,data)=>{const f=p(rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof data==="string"?data:JSON.stringify(data,null,2)+"\n");};
const read=rel=>JSON.parse(fs.readFileSync(p(rel),"utf8"));
const sha256File=f=>crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const run=(cmd,args,env={})=>{const r=spawnSync(cmd,args,{cwd:tmp,encoding:"utf8",env:{...process.env,...env}});return {status:r.status??1,stdout:r.stdout||"",stderr:r.stderr||""};};
const git=(...args)=>execFileSync("git",args,{cwd:tmp,encoding:"utf8"}).trim();
const head=()=>git("rev-parse","HEAD");
const commit=msg=>{git("add","-A");execFileSync("git",["commit","-q","-m",msg],{cwd:tmp,stdio:"ignore"});return head();};
const gate=(base,h)=>run("npm",["run","gate"],{BASE_SHA:base,HEAD_SHA:h});
const record=(name,ok,detail="")=>{results.push({name,ok,detail});console.log((ok?"PASS":"FAIL")+" :: "+name+(detail?" :: "+detail:""));if(!ok) throw new Error(name+" :: "+detail);};
const expectGate=(name,base,h)=>{const r=gate(base,h);record(name,r.status===0,r.status===0?"full gate passed":(r.stdout+"\n"+r.stderr).slice(-3500));};

const writeBaseline=()=>{
  const dir=`build-spec/baselines/${BS}`;
  write(`${dir}/functions/F99-fake.md`,"# F99 Fake Contract\n\nReturn OK deterministically.\n");
  write(`${dir}/registries/acceptance-test-registry.json`,{
    schema_version:1,
    entries:[{acceptance_id:AC,test_id:TEST,contract_status:"READY_FOR_IMPLEMENTATION"}]
  });
  const rels=["functions/F99-fake.md","registries/acceptance-test-registry.json"].sort();
  const inventory=rels.map(rel=>({path:rel,sha256:sha256File(p(dir,rel))}));
  const aggregate=crypto.createHash("sha256").update(inventory.map(x=>x.path+":"+x.sha256+"\n").join("")).digest("hex");
  write(`${dir}/manifest.json`,{
    schema_version:1,baseline_id:BS,status:"LOCKED",
    source_repo:read("harness/policy/repo-policy.json").design_source_repo,
    source_working_commit:SOURCE_COMMIT,created_at:NOW,supersedes:null,approved_delta_ids:[],
    approval:{status:"USER_APPROVED",decision_ref:"FAKE-E2E-FREEZE"},
    acceptance_registry:"registries/acceptance-test-registry.json",acceptance_count:1,
    file_inventory:inventory,content_sha256:aggregate
  });
  write(`build-spec/activations/${BS}.json`,{
    schema_version:1,baseline_id:BS,previous_baseline:null,type:"INITIAL_FREEZE",status:"USER_APPROVED",
    decision_ref:"FAKE-E2E-FREEZE",approved_delta_ids:[],source_working_commit:SOURCE_COMMIT,activated_at:NOW
  });
};

const evidence=(n,kind,sourceCommit,extra={})=>{
  const id=`EV-${SP}-${TASK}-${String(n).padStart(3,"0")}`;
  write(`delivery/evidence/${id}.json`,{
    schema_version:2,evidence_id:id,kind,build_spec_id:BS,sprint_id:SP,task_id:TASK,
    acceptance_ids:[],test_ids:[],status:"PASS",command:null,review_checks:null,blocking_findings:[],
    locator:"fake-e2e://"+id.toLowerCase(),sha256:null,source_commit:sourceCommit,recorded_at:NOW,...extra
  });
  return id;
};

try{
  fs.cpSync(source,tmp,{recursive:true,filter:s=>{
    const rel=path.relative(source,s);if(!rel)return true;
    const parts=rel.split(path.sep);return !parts.includes(".git")&&!parts.includes("node_modules");
  }});
  fs.rmSync(p("build-spec/baselines"),{recursive:true,force:true});fs.mkdirSync(p("build-spec/baselines"),{recursive:true});
  fs.rmSync(p("build-spec/activations"),{recursive:true,force:true});fs.mkdirSync(p("build-spec/activations"),{recursive:true});
  fs.rmSync(p("delivery/sprints"),{recursive:true,force:true});fs.mkdirSync(p("delivery/sprints"),{recursive:true});
  fs.rmSync(p("delivery/evidence"),{recursive:true,force:true});fs.mkdirSync(p("delivery/evidence"),{recursive:true});
  fs.rmSync(p("delivery/findings"),{recursive:true,force:true});fs.mkdirSync(p("delivery/findings"),{recursive:true});
  fs.rmSync(p("package-lock.json"),{force:true});

  git("init","-q","-b","main");
  git("config","user.name","Cursor Build Machine Demo");
  git("config","user.email","fake-sprint@example.invalid");
  git("add","-A");
  execFileSync("git",["commit","-q","-m","fixture: clean generic machine"],{cwd:tmp,stdio:"ignore"});

  // 1. Freeze + READY Backlog + PLANNED Sprint. No implementation yet.
  {
    const base=head();
    writeBaseline();
    write("build-spec/CURRENT.json",{schema_version:1,active_baseline:BS,implementation_enabled:false,reason:"FAKE E2E: frozen, not activated"});
    write("delivery/CURRENT-SPRINT.json",{schema_version:1,active_sprint:null,active_build_spec:null,active_task:null,status:"HOLD",automation_mode:"SAFE_AUTOMATION",reason:"FAKE E2E: awaiting Human activation"});
    write("delivery/backlog/QUEUE.json",{schema_version:1,build_spec_id:BS,status:"OPEN",items:[{
      backlog_item_id:BL,source:"BUILD_SPEC",build_spec_id:BS,function_id:"F99",title:"Fake E2E work item",
      status:"READY",priority:"P0",scope_contracts:["F99"],acceptance_links:[{acceptance_id:AC,test_id:TEST,test_family:"behavior"}],
      dependencies:[],product_decision_allowed:false
    }]});
    write(`delivery/sprints/${SP}/manifest.json`,{
      schema_version:1,sprint_id:SP,status:"PLANNED",build_spec_id:BS,backlog_item_ids:[BL],
      goal:"Verify generic Build Machine execution lifecycle.",scope:["F99 fake fixture"],non_scope:["real product"],
      tasks_file:"tasks.json",entry_gate:{build_spec_locked:true,baseline_gate_passed:true,acceptance_mapped:true,user_approved:false,approval_ref:null}
    });
    write(`delivery/sprints/${SP}/tasks.json`,{schema_version:3,sprint_id:SP,tasks:[{
      task_id:TASK,backlog_item_ids:[BL],title:"Implement fake F99 behavior",status:"PLANNED",build_spec_id:BS,
      scope:["return OK"],non_scope:["real product"],acceptance_links:[{acceptance_id:AC,test_id:TEST}],
      allowed_write_paths:["src/fake-e2e/","tests/behavior/","package-lock.json"],
      required_commands:["npm run gate"],required_skills:["implementer","test-builder","reviewer"],
      parallel_safe:false,product_decision_allowed:false,blocked_by:[],completion_evidence:[]
    }]});
    const h=commit("fake: freeze and plan sprint");
    expectGate("Freeze + READY Backlog + PLANNED Sprint",base,h);
  }

  // 2. Human Sprint Activation is control-only.
  {
    const base=head();
    const bc=read("build-spec/CURRENT.json");bc.implementation_enabled=true;bc.reason="FAKE E2E: Human Sprint Activation";write("build-spec/CURRENT.json",bc);
    const q=read("delivery/backlog/QUEUE.json");q.items[0].status="SPRINTED";q.items[0].sprint_id=SP;write("delivery/backlog/QUEUE.json",q);
    const sm=read(`delivery/sprints/${SP}/manifest.json`);sm.status="ACTIVE";sm.entry_gate.user_approved=true;sm.entry_gate.approval_ref="FAKE-E2E-SPRINT-ACTIVATION";write(`delivery/sprints/${SP}/manifest.json`,sm);
    const td=read(`delivery/sprints/${SP}/tasks.json`);td.tasks[0].status="IN_PROGRESS";write(`delivery/sprints/${SP}/tasks.json`,td);
    write("delivery/CURRENT-SPRINT.json",{schema_version:1,active_sprint:SP,active_build_spec:BS,active_task:TASK,status:"ACTIVE",automation_mode:"SAFE_AUTOMATION",reason:"FAKE E2E: active"});
    const h=commit("fake: human activates sprint");
    expectGate("Human Sprint Activation",base,h);
    const pci=run("node",["ci/run-product-ci.mjs"],{BASE_SHA:base,HEAD_SHA:h});
    record("Control-only Activation does not fake Product CI",pci.status===0,(pci.stdout+pci.stderr).trim().split("\n").slice(-2).join(" | "));
  }

  // 3. First real implementation carries lockfile + executable mapped Test ID.
  let codeCommit;
  {
    const base=head();
    write("package-lock.json",{name:"cursor-build-machine",version:"0.0.0",lockfileVersion:3,requires:true,packages:{"":{name:"cursor-build-machine",version:"0.0.0"}}});
    write("src/fake-e2e/feature.ts",'export const fakeValue = (): string => "OK";\n');
    write("tests/behavior/fake-e2e.test.ts",'import { expect, test } from "vitest";\nimport { fakeValue } from "../../src/fake-e2e/feature";\ntest("TEST-F99-001 returns OK", () => { expect(fakeValue()).toBe("OK"); });\n');
    codeCommit=commit("fake: first implementation with lockfile and mapped test");
    expectGate("First Task implementation",base,codeCommit);
  }

  // 4. PASS Test + Command Evidence while Task remains IN_PROGRESS.
  let evidenceCommit;
  {
    const base=head();
    const ids=[];
    ids.push(evidence(1,"TEST_RESULT",codeCommit,{acceptance_ids:[AC],test_ids:[TEST]}));
    const commands=["npm run check:types","npm run check:lint","npm run security:audit","npm run build","npm run gate"];
    let n=2;for(const command of commands) ids.push(evidence(n++,"COMMAND_RESULT",codeCommit,{command}));
    evidenceCommit=commit("fake: record test and command evidence");
    expectGate("PASS Test + Command Evidence",base,evidenceCommit);
  }

  // 5. Enter REVIEW only after all required completion proof exists.
  let reviewStateCommit;
  {
    const base=head();
    const td=read(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status="REVIEW";
    td.tasks[0].completion_evidence=[
      `EV-${SP}-${TASK}-001`,`EV-${SP}-${TASK}-002`,`EV-${SP}-${TASK}-003`,
      `EV-${SP}-${TASK}-004`,`EV-${SP}-${TASK}-005`,`EV-${SP}-${TASK}-006`
    ];
    write(`delivery/sprints/${SP}/tasks.json`,td);
    const sm=read(`delivery/sprints/${SP}/manifest.json`);sm.status="REVIEW";write(`delivery/sprints/${SP}/manifest.json`,sm);
    const cs=read("delivery/CURRENT-SPRINT.json");cs.status="REVIEW";write("delivery/CURRENT-SPRINT.json",cs);
    reviewStateCommit=commit("fake: enter review with complete execution evidence");
    expectGate("Task enters REVIEW",base,reviewStateCommit);
  }

  // 6. Engineering + Semantic Review PASS.
  let reviewEvidenceId;
  {
    const base=head();
    const checks={};
    for(const k of read("harness/policy/engineering-quality.json").required_review_checks) checks[k]="PASS";
    reviewEvidenceId=evidence(7,"REVIEW",reviewStateCommit,{review_checks:checks,blocking_findings:[]});
    const h=commit("fake: engineering quality review pass");
    expectGate("Engineering + Semantic Review Evidence",base,h);
  }

  // 7. Human Sprint Close returns machine to HOLD.
  {
    const base=head();
    const td=read(`delivery/sprints/${SP}/tasks.json`);td.tasks[0].status="CLOSED";td.tasks[0].completion_evidence.push(reviewEvidenceId);write(`delivery/sprints/${SP}/tasks.json`,td);
    const sm=read(`delivery/sprints/${SP}/manifest.json`);sm.status="CLOSED";write(`delivery/sprints/${SP}/manifest.json`,sm);
    const q=read("delivery/backlog/QUEUE.json");q.items[0].status="DONE";write("delivery/backlog/QUEUE.json",q);
    const bc=read("build-spec/CURRENT.json");bc.implementation_enabled=false;bc.reason="FAKE E2E: Sprint closed";write("build-spec/CURRENT.json",bc);
    write("delivery/CURRENT-SPRINT.json",{schema_version:1,active_sprint:null,active_build_spec:null,active_task:null,status:"HOLD",automation_mode:"SAFE_AUTOMATION",reason:"FAKE E2E: Sprint closed"});
    const h=commit("fake: close sprint and return to hold");
    expectGate("Sprint Close + HOLD Reset",base,h);
  }

  record("Full Fake Sprint E2E",true,"PLANNED → ACTIVATED → IMPLEMENTED → EVIDENCED → REVIEWED → CLOSED");
  console.log("FAKE_SPRINT_E2E_RESULT="+JSON.stringify({fixture:"ephemeral",fake_data_persisted:false,operating_e2e_verdict:"PASS",results}));
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log("CLEANUP :: ephemeral fixture deleted");
}
