import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), errors=[];
const read=r=>JSON.parse(fs.readFileSync(path.join(root,r),"utf8"));
const exists=r=>fs.existsSync(path.join(root,r));
const current=read("build-spec/CURRENT.json");
const queue=read("delivery/backlog/QUEUE.json");
const states=new Set(["QUEUED","READY","SPRINTED","BLOCKED","DONE"]);
const priorities=new Set(["P0","P1","P2","P3"]);

if(queue.schema_version!==1) errors.push("Backlog schema_version must be 1.");
if(current.active_baseline===null){
  if(queue.build_spec_id!==null || queue.status!=="HOLD" || (queue.items||[]).length) errors.push("No active Build Spec requires empty HOLD backlog.");
}else{
  if(queue.build_spec_id!==current.active_baseline) errors.push("Backlog Build Spec must equal active baseline.");
  if(queue.status!=="OPEN") errors.push("Active Build Spec requires Backlog status OPEN.");

  const manifest=read("build-spec/baselines/"+current.active_baseline+"/manifest.json");
  const reg=read("build-spec/baselines/"+current.active_baseline+"/"+manifest.acceptance_registry);
  const ac=new Map((reg.entries||[]).filter(e=>e.contract_status==="READY_FOR_IMPLEMENTATION").map(e=>[e.acceptance_id,e]));
  const ids=new Set();
  for(const item of queue.items||[]){
    if(!/^BL-P\d+-\d{3,}$/.test(item.backlog_item_id||"")) errors.push("Invalid backlog item id: "+item.backlog_item_id);
    if(ids.has(item.backlog_item_id)) errors.push("Duplicate backlog item: "+item.backlog_item_id); ids.add(item.backlog_item_id);
    if(item.source!=="BUILD_SPEC") errors.push(item.backlog_item_id+" source must be BUILD_SPEC");
    if(item.build_spec_id!==current.active_baseline) errors.push(item.backlog_item_id+" baseline mismatch");
    if(!/^F\d{2}$/.test(item.function_id||"")) errors.push(item.backlog_item_id+" invalid function_id");
    if(!states.has(item.status)) errors.push(item.backlog_item_id+" invalid status");
    if(!priorities.has(item.priority)) errors.push(item.backlog_item_id+" invalid priority");
    if(item.product_decision_allowed!==false) errors.push(item.backlog_item_id+" product_decision_allowed must be false");
    if(!Array.isArray(item.acceptance_links)||!item.acceptance_links.length) errors.push(item.backlog_item_id+" requires Acceptance/Test mapping");
    for(const link of item.acceptance_links||[]){
      const e=ac.get(link.acceptance_id);
      if(!e) errors.push(item.backlog_item_id+" unknown/inactive Acceptance "+link.acceptance_id);
      else if(e.test_id!==link.test_id) errors.push(item.backlog_item_id+" Test mismatch for "+link.acceptance_id);
    }
    if(item.status==="SPRINTED"){
      if(!item.sprint_id || !exists("delivery/sprints/"+item.sprint_id+"/manifest.json")) errors.push(item.backlog_item_id+" SPRINTED requires existing sprint_id");
    }
  }
}
if(errors.length){console.error("BACKLOG GATE: FAIL");errors.forEach(e=>console.error("- "+e));process.exit(1);}
console.log("BACKLOG GATE: PASS");
