import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd(), errors=[];
const read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8'));
const policy=read('harness/policy/repo-policy.json');
const cs=read('delivery/CURRENT-SPRINT.json');
const currentBuild=read('build-spec/CURRENT.json');
const holdExceptions=new Set(policy.hold_exceptions||[]);

const getChanged=()=>{
  const base=process.env.BASE_SHA, head=process.env.HEAD_SHA||'HEAD';
  if(base && !/^0+$/.test(base)){
    try{return execFileSync('git',['diff','--name-only',base,head],{encoding:'utf8'}).trim().split('\n').filter(Boolean);}
    catch{errors.push('Unable to calculate CI change scope.'); return [];}
  }
  try{
    const a=execFileSync('git',['diff','--name-only','HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const b=execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
    const c=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
    return [...new Set([...a,...b,...c])];
  }catch{return [];}
};
const changed=getChanged();
const isImpl=p=>(policy.implementation_roots||[]).some(prefix=>p.startsWith(prefix)) && !holdExceptions.has(p);
const isGov=p=>(policy.governance_only_paths||[]).some(prefix=>prefix.endsWith('/')?p.startsWith(prefix):p===prefix);
const pathAllowed=(p,allowed)=>allowed.some(a=>a.endsWith('/')?p.startsWith(a):p===a);

const baseSha=process.env.BASE_SHA;
const showBaseJson=rel=>{
  if(!baseSha || /^0+$/.test(baseSha)) return null;
  try{return JSON.parse(execFileSync('git',['show',baseSha+':'+rel],{encoding:'utf8'}));}
  catch{return null;}
};
const baseSprint=showBaseJson('delivery/CURRENT-SPRINT.json');
const baseBuild=showBaseJson('build-spec/CURRENT.json');
const sprintManifest=cs.active_sprint ? read('delivery/sprints/'+cs.active_sprint+'/manifest.json') : null;
const isSprintActivation=
  cs.status==='ACTIVE' &&
  cs.active_sprint!==null &&
  baseSprint?.active_sprint===null &&
  baseSprint?.status==='HOLD' &&
  baseBuild?.active_baseline===currentBuild.active_baseline &&
  baseBuild?.implementation_enabled===false &&
  currentBuild.implementation_enabled===true &&
  cs.active_build_spec===currentBuild.active_baseline &&
  sprintManifest?.entry_gate?.user_approved===true &&
  typeof sprintManifest?.entry_gate?.approval_ref==='string' &&
  sprintManifest.entry_gate.approval_ref.length>0;

const sprintActivationAllowed=new Set(isSprintActivation ? [
  'build-spec/CURRENT.json',
  'delivery/CURRENT-SPRINT.json',
  'delivery/sprints/'+cs.active_sprint+'/manifest.json',
  'delivery/sprints/'+cs.active_sprint+'/tasks.json'
] : []);

if(cs.active_sprint===null){
  for(const p of changed) if(isImpl(p)) errors.push('Product implementation changed while Build/Sprint HOLD: '+p);
}else if(cs.status==='BLOCKED'){
  for(const p of changed) if(isImpl(p)) errors.push('Sprint BLOCKED: product implementation change forbidden: '+p);
}else if(['ACTIVE','REVIEW'].includes(cs.status)){
  const tasks=read('delivery/sprints/'+cs.active_sprint+'/tasks.json').tasks||[];
  const task=tasks.find(t=>t.task_id===cs.active_task);
  if(!task) errors.push('Active Task not found for scope validation: '+cs.active_task);
  else{
    for(const p of changed){
      if(isGov(p) && !sprintActivationAllowed.has(p)) errors.push('Governance-only path changed while Sprint '+cs.status+'; BLOCK Sprint first: '+p);
      if(isImpl(p) && !pathAllowed(p,task.allowed_write_paths||[])) errors.push('Active Task '+task.task_id+' write-scope violation: '+p);
    }
  }
}

if(errors.length){console.error('CHANGE SCOPE GATE: FAIL'); errors.forEach(e=>console.error('- '+e)); process.exit(1);}
console.log('CHANGE SCOPE GATE: PASS');
if(!changed.length) console.log('- No diff base / local changes detected; structural gates still enforced.');

if(isSprintActivation) console.log('- Approved Sprint Activation transition recognized; only activation state-control files were allowlisted.');
