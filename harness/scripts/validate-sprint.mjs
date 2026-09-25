import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(), errors=[];
const read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8'));
const exists=r=>fs.existsSync(path.join(root,r));
const cs=read('delivery/CURRENT-SPRINT.json'), cb=read('build-spec/CURRENT.json'), backlog=read('delivery/backlog/QUEUE.json'), skillRegistry=read('skills/REGISTRY.json');
const registeredSkills=new Set((skillRegistry.skills||[]).map(x=>x.id));
const sprintStates=new Set(['HOLD','PLANNED','ACTIVE','BLOCKED','REVIEW','CLOSED']);
const taskStates=new Set(['PLANNED','IN_PROGRESS','BLOCKED','REVIEW','VERIFIED','CLOSED']);
const protectedPrefixes=['build-spec/','harness/','ci/','deploy/','releases/','skills/','.cursor/','.github/','delivery/templates/','delivery/deltas/'];
const backlogById=new Map((backlog.items||[]).map(x=>[x.backlog_item_id,x]));

if(!sprintStates.has(cs.status)) errors.push('Invalid CURRENT-SPRINT status.');
if(cs.active_sprint===null){
  if(cs.status!=='HOLD') errors.push('No active Sprint must be HOLD.');
  if(cs.active_build_spec!==null) errors.push('No active Sprint must not bind Build Spec.');
  if(cs.active_task!==null) errors.push('No active Sprint must not have active Task.');
  if(cb.implementation_enabled!==false) errors.push('Implementation must be disabled when no active Sprint exists.');
}else{
  if(!cb.implementation_enabled) errors.push('Active Sprint requires implementation_enabled=true.');
  if(cs.active_build_spec!==cb.active_baseline) errors.push('Sprint Build Spec must equal active Build Spec.');
  if(!['ACTIVE','BLOCKED','REVIEW'].includes(cs.status)) errors.push('CURRENT active Sprint status must be ACTIVE, BLOCKED, or REVIEW.');
  const dir='delivery/sprints/'+cs.active_sprint, mp=dir+'/manifest.json', tp=dir+'/tasks.json';
  if(!exists(mp)||!exists(tp)) errors.push('Active Sprint manifest/tasks missing.');
  else{
    const m=read(mp), td=read(tp);
    if(m.sprint_id!==cs.active_sprint) errors.push('Sprint ID mismatch.');
    if(m.build_spec_id!==cb.active_baseline) errors.push('Sprint baseline mismatch.');
    if(!m.entry_gate?.build_spec_locked || !m.entry_gate?.baseline_gate_passed || !m.entry_gate?.acceptance_mapped) errors.push('Sprint entry gate incomplete.');
    if(m.entry_gate?.user_approved!==true || !m.entry_gate?.approval_ref) errors.push('Active Sprint requires User approval reference.');
    if(!Array.isArray(td.tasks)||!td.tasks.length) errors.push('Active Sprint has no tasks.');

    const manifest=read('build-spec/baselines/'+cb.active_baseline+'/manifest.json');
    const registry=read('build-spec/baselines/'+cb.active_baseline+'/'+manifest.acceptance_registry);
    const activeAcceptance=new Map((registry.entries||[]).filter(e=>e.contract_status==='READY_FOR_IMPLEMENTATION').map(e=>[e.acceptance_id,e]));
    const ids=new Set(); let activeTaskObj=null;
    for(const t of td.tasks||[]){
      if(ids.has(t.task_id)) errors.push('Duplicate task ID: '+t.task_id); ids.add(t.task_id);
      if(!taskStates.has(t.status)) errors.push('Invalid task status: '+t.task_id);
      if(t.build_spec_id!==cb.active_baseline) errors.push('Task baseline mismatch: '+t.task_id);
      if(t.product_decision_allowed!==false) errors.push('product_decision_allowed must be false: '+t.task_id);
      if(!Array.isArray(t.backlog_item_ids)||!t.backlog_item_ids.length) errors.push('Missing backlog mapping: '+t.task_id);
      for(const bid of t.backlog_item_ids||[]){
        const bi=backlogById.get(bid);
        if(!bi) errors.push('Unknown backlog item '+bid+' in '+t.task_id);
        else if(bi.build_spec_id!==t.build_spec_id) errors.push('Backlog baseline mismatch '+bid+' in '+t.task_id);
      }
      if(!Array.isArray(t.acceptance_links)||!t.acceptance_links.length) errors.push('Missing Acceptance/Test mapping: '+t.task_id);
      for(const link of t.acceptance_links||[]){
        const a=activeAcceptance.get(link.acceptance_id);
        if(!a) errors.push('Unknown or inactive Acceptance '+link.acceptance_id+' in '+t.task_id);
        else if(a.test_id!==link.test_id) errors.push('Test ID mismatch for '+link.acceptance_id+' in '+t.task_id+': expected '+a.test_id);
      }
      if(!Array.isArray(t.allowed_write_paths)||!t.allowed_write_paths.length) errors.push('Missing allowed_write_paths: '+t.task_id);
      for(const p of t.allowed_write_paths||[]){
        if(typeof p!=='string' || !p || p.startsWith('/') || p.includes('..')) errors.push('Invalid allowed_write_path in '+t.task_id+': '+p);
        if(protectedPrefixes.some(x=>p.startsWith(x)) || p==='AGENTS.md') errors.push('Task may not write governance path in '+t.task_id+': '+p);
      }
      if(!Array.isArray(t.required_commands)||!t.required_commands.length) errors.push('Missing required_commands: '+t.task_id);
      if(!Array.isArray(t.required_skills)||!t.required_skills.length) errors.push('Missing required_skills: '+t.task_id);
      for(const sid of t.required_skills||[]) if(!registeredSkills.has(sid)) errors.push('Unknown required Skill '+sid+' in '+t.task_id);
      if(!Array.isArray(t.completion_evidence)) errors.push('completion_evidence must be array: '+t.task_id);
      if(t.task_id===cs.active_task) activeTaskObj=t;
    }
    if(!cs.active_task) errors.push('Active Sprint requires exactly one active_task pointer.');
    else if(!activeTaskObj) errors.push('active_task not found: '+cs.active_task);
    else{
      const allowedBySprint={ACTIVE:new Set(['IN_PROGRESS']), REVIEW:new Set(['REVIEW','IN_PROGRESS']), BLOCKED:new Set(['BLOCKED'])};
      if(!allowedBySprint[cs.status]?.has(activeTaskObj.status)) errors.push('active_task status '+activeTaskObj.status+' incompatible with Sprint '+cs.status);
    }
    const activeCount=(td.tasks||[]).filter(t=>['IN_PROGRESS','REVIEW'].includes(t.status)).length;
    if(activeCount>1) errors.push('Only one Task may be IN_PROGRESS/REVIEW at a time.');
  }
}

if(errors.length){console.error('SPRINT GATE: FAIL'); errors.forEach(e=>console.error('- '+e)); process.exit(1);}
console.log('SPRINT GATE: PASS');
