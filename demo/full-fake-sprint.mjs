import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';

const source = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nffbuild-fake-sprint-'));
const results = [];
const now = '2026-09-25T00:00:00Z';
const WORKING_V1 = '1111111111111111111111111111111111111111';
const WORKING_V2 = '2222222222222222222222222222222222222222';
const BS1 = 'BS-P9-901';
const BS2 = 'BS-P9-902';
const SP = 'SP-P9-901';
const TASK = 'T001';
const BL = 'BL-P9-901';
const AC = 'F99-AC-001';
const TEST = 'TEST-F99-001';
const DELTA = 'BD-901';

const p = (...xs) => path.join(tmp, ...xs);
const write = (rel, content) => {
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), content);
};
const writeJson = (rel, value) => write(rel, JSON.stringify(value, null, 2) + '\n');
const readJson = rel => JSON.parse(fs.readFileSync(p(rel), 'utf8'));
const sha256File = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || tmp,
    env: { ...process.env, ...(opts.env || {}) },
    encoding: 'utf8'
  });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
};
const git = args => execFileSync('git', args, { cwd: tmp, encoding: 'utf8' }).trim();
const head = () => git(['rev-parse', 'HEAD']);
const commitAll = message => {
  git(['add', '-A']);
  execFileSync('git', ['commit', '-q', '-m', message], { cwd: tmp, stdio: 'ignore' });
  return head();
};
const fullGate = (base, headSha) => run('npm', ['run', 'gate'], { env: { BASE_SHA: base, HEAD_SHA: headSha } });
const validatorsWithoutScope = [
  'validate-baseline.mjs', 'governance-gate.mjs', 'validate-activation.mjs',
  'validate-skills.mjs', 'validate-toolchain.mjs', 'validate-backlog.mjs',
  'validate-sprint.mjs', 'validate-findings.mjs', 'validate-evidence.mjs',
  'validate-release.mjs'
];
const gateWithoutScope = (base, headSha) => {
  const logs = [];
  for (const file of validatorsWithoutScope) {
    const r = run('node', [`harness/scripts/${file}`], { env: { BASE_SHA: base, HEAD_SHA: headSha } });
    logs.push(`${file}: ${r.status === 0 ? 'PASS' : 'FAIL'}\n${r.stdout}${r.stderr}`);
    if (r.status !== 0) return { status: r.status, stdout: logs.join('\n'), stderr: '' };
  }
  return { status: 0, stdout: logs.join('\n'), stderr: '' };
};
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} :: ${name} :: ${detail}`);
  if (!ok) throw new Error(`${name}: ${detail}`);
};
const expectGatePass = (name, base, headSha) => {
  const r = fullGate(base, headSha);
  record(name, r.status === 0, r.status === 0 ? 'full gate passed' : `${r.stdout}\n${r.stderr}`.slice(-3000));
};

const writeBaseline = ({ id, sourceCommit, supersedes, approvedDeltaIds, decisionRef, contractText }) => {
  const dir = `build-spec/baselines/${id}`;
  write(`${dir}/functions/F99-fake.md`, `# F99 Fake Contract\n\n${contractText}\n`);
  writeJson(`${dir}/registries/acceptance-test-registry.json`, {
    schema_version: 1,
    entries: [
      { acceptance_id: AC, test_id: TEST, contract_status: 'READY_FOR_IMPLEMENTATION' }
    ]
  });
  const files = ['functions/F99-fake.md', 'registries/acceptance-test-registry.json'].sort();
  const inventory = files.map(rel => ({ path: rel, sha256: sha256File(p(dir, rel)) }));
  const aggregate = crypto.createHash('sha256')
    .update(inventory.map(x => `${x.path}:${x.sha256}\n`).join(''))
    .digest('hex');
  writeJson(`${dir}/manifest.json`, {
    schema_version: 1,
    baseline_id: id,
    status: 'LOCKED',
    source_repo: readJson('harness/policy/repo-policy.json').design_source_repo,
    source_working_commit: sourceCommit,
    created_at: now,
    supersedes,
    approved_delta_ids: approvedDeltaIds,
    approval: { status: 'USER_APPROVED', decision_ref: decisionRef },
    acceptance_registry: 'registries/acceptance-test-registry.json',
    acceptance_count: 1,
    file_inventory: inventory,
    content_sha256: aggregate
  });
};

try {
  fs.cpSync(source, tmp, {
    recursive: true,
    filter: src => {
      const rel = path.relative(source, src);
      if (!rel) return true;
      const parts = rel.split(path.sep);
      return !parts.includes('.git') && !parts.includes('node_modules');
    }
  });

  git(['init', '-q']);
  git(['config', 'user.name', 'Cursor Build Machine Demo']);
  git(['config', 'user.email', 'fake-sprint@nff.invalid']);
  git(['add', '-A']);
  execFileSync('git', ['commit', '-q', '-m', 'fixture: base'], { cwd: tmp, stdio: 'ignore' });

  // 1) Initial freeze + backlog projection + planned Sprint, while implementation remains HOLD.
  {
    const base = head();
    writeBaseline({
      id: BS1, sourceCommit: WORKING_V1, supersedes: null, approvedDeltaIds: [],
      decisionRef: 'CHAT-20260925-FAKE-E2E-INITIAL-FREEZE', contractText: 'Version 1: return OK.'
    });
    writeJson(`build-spec/activations/${BS1}.json`, {
      schema_version: 1, baseline_id: BS1, previous_baseline: null, type: 'INITIAL_FREEZE',
      status: 'USER_APPROVED', decision_ref: 'CHAT-20260925-FAKE-E2E-INITIAL-FREEZE',
      approved_delta_ids: [], source_working_commit: WORKING_V1, activated_at: now
    });
    writeJson('build-spec/CURRENT.json', {
      schema_version: 1, active_baseline: BS1, implementation_enabled: false,
      reason: 'FAKE E2E fixture: baseline frozen, Sprint not active.'
    });
    writeJson(`delivery/sprints/${SP}/manifest.json`, {
      schema_version: 1, sprint_id: SP, status: 'PLANNED', build_spec_id: BS1,
      goal: 'Exercise the generic Cursor Build Machine delivery lifecycle without touching product truth.',
      scope: ['F99 fake fixture'], non_scope: ['real product'], tasks_file: 'tasks.json',
      entry_gate: { build_spec_locked: true, baseline_gate_passed: true, acceptance_mapped: true, user_approved: false, approval_ref: null }
    });
    writeJson(`delivery/sprints/${SP}/tasks.json`, {
      schema_version: 3, sprint_id: SP,
      tasks: [{
        task_id: TASK, backlog_item_ids: [BL], title: 'Implement fake F99 behavior', status: 'PLANNED', build_spec_id: BS1,
        scope: ['fake return value'], non_scope: ['real product'],
        acceptance_links: [{ acceptance_id: AC, test_id: TEST }],
        allowed_write_paths: ['src/fake-e2e/', 'tests/unit/fake-e2e.test.mjs'],
        required_commands: ['node tests/unit/fake-e2e.test.mjs', 'npm run gate'],
        required_skills: ['implementer', 'test-builder', 'reviewer'], parallel_safe: false,
        product_decision_allowed: false, blocked_by: [], completion_evidence: []
      }]
    });
    writeJson('delivery/backlog/QUEUE.json', {
      schema_version: 1, build_spec_id: BS1, status: 'OPEN',
      items: [{
        backlog_item_id: BL, source: 'BUILD_SPEC', build_spec_id: BS1, function_id: 'F99', title: 'Fake E2E work item',
        status: 'SPRINTED', priority: 'P0', scope_contracts: ['F99'],
        acceptance_links: [{ acceptance_id: AC, test_id: TEST, test_family: 'behavior' }],
        dependencies: [], sprint_id: SP, product_decision_allowed: false
      }]
    });
    const h = commitAll('fake: initial freeze and backlog');
    expectGatePass('Initial Freeze + Backlog + Planned Sprint', base, h);
  }

  // 2) Sprint activation. This intentionally exposes the current change-scope atomicity conflict.
  {
    const base = head();
    const current = readJson('build-spec/CURRENT.json');
    current.implementation_enabled = true;
    current.reason = 'FAKE E2E fixture: approved Sprint active.';
    writeJson('build-spec/CURRENT.json', current);
    writeJson('package-lock.json', {
      name: 'nff-build', version: '0.0.0', lockfileVersion: 3, requires: true,
      packages: { '': { name: 'nff-build', version: '0.0.0' } }
    });
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.status = 'ACTIVE';
    sm.entry_gate.user_approved = true;
    sm.entry_gate.approval_ref = 'CHAT-20260925-FAKE-E2E-SPRINT-ACTIVATION';
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status = 'IN_PROGRESS';
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    writeJson('delivery/CURRENT-SPRINT.json', {
      schema_version: 1, active_sprint: SP, active_build_spec: BS1, active_task: TASK,
      status: 'ACTIVE', automation_mode: 'SAFE_AUTOMATION', reason: 'FAKE E2E active Sprint.'
    });
    const h = commitAll('fake: activate sprint');
    expectGatePass('Sprint Activation full gate', base, h);
  }

  // 3) Product code is now scoped to one Task. Inject a bug; governance passes but the mapped test fails.
  {
    const base = head();
    write('src/fake-e2e/feature.mjs', `export const fakeValue = () => 'WRONG';\n`);
    write('tests/unit/fake-e2e.test.mjs', `import assert from 'node:assert/strict';\nimport { fakeValue } from '../../src/fake-e2e/feature.mjs';\nassert.equal(fakeValue(), 'OK');\nconsole.log('fake unit PASS');\n`);
    const h = commitAll('fake: introduce implementation bug');
    expectGatePass('Active Task write-scope gate with buggy code', base, h);
    const t = run('node', ['tests/unit/fake-e2e.test.mjs']);
    record('Mapped test catches implementation bug', t.status !== 0, t.status !== 0 ? 'test failed as expected' : 'bug escaped test');
  }

  // 4) Fix bug, create Finding and Evidence.
  {
    const base = head();
    write('src/fake-e2e/feature.mjs', `export const fakeValue = () => 'OK';\n`);
    writeJson('delivery/findings/BF-901.json', {
      schema_version: 1, finding_id: 'BF-901', classification: 'IMPLEMENTATION_BUG', status: 'RESOLVED',
      build_spec_id: BS1, sprint_id: SP, task_id: TASK,
      expected: 'fakeValue returns OK', actual: 'fakeValue returned WRONG',
      evidence: ['command://node-tests-unit-fake-e2e-failed'],
      attempts: [{ attempt_id: 'A1', strategy: 'return-value-fix', result: 'FAILED', evidence: 'command://initial-test' }],
      affected_contracts: ['F99'], affected_acceptance: [AC], contract_affecting: false, delta_id: null
    });
    writeJson(`delivery/evidence/EV-${SP}-${TASK}-001.json`, {
      schema_version: 1, evidence_id: `EV-${SP}-${TASK}-001`, kind: 'TEST_RESULT', build_spec_id: BS1,
      sprint_id: SP, task_id: TASK, acceptance_ids: [AC], test_ids: [TEST], status: 'PASS',
      locator: 'command://node-tests-unit-fake-e2e-pass-v1', sha256: null, recorded_at: now
    });
    const h = commitAll('fake: fix implementation bug and record evidence');
    expectGatePass('Fast Loop fix + Finding + Evidence', base, h);
    const t = run('node', ['tests/unit/fake-e2e.test.mjs']);
    record('Mapped test passes after fix', t.status === 0, t.status === 0 ? 'test passed' : `${t.stdout}\n${t.stderr}`.slice(-1500));
  }

  // 5) Slow Loop: contract-affecting Finding blocks Task and creates Design Delta.
  {
    const base = head();
    writeJson('delivery/findings/BF-902.json', {
      schema_version: 1, finding_id: 'BF-902', classification: 'DESIGN_DELTA_CANDIDATE', status: 'BLOCKED',
      build_spec_id: BS1, sprint_id: SP, task_id: TASK,
      expected: 'contract version 1 remains sufficient', actual: 'fake fixture requires a contract-affecting v2 change',
      evidence: ['fake-e2e://design-delta-candidate'], attempts: [], affected_contracts: ['F99'], affected_acceptance: [AC],
      contract_affecting: true, delta_id: DELTA
    });
    writeJson(`delivery/deltas/${DELTA}.json`, {
      schema_version: 1, delta_id: DELTA, type: 'DESIGN_DELTA', status: 'OPEN', source_finding_ids: ['BF-902'],
      affected_build_spec: BS1, affected_tasks: [TASK], affected_contracts: ['F99'], affected_acceptance: [AC],
      changes_contract_semantics: true, owner: 'HUMAN_GOVERNANCE', user_decision_required: true,
      user_decision: { status: 'PENDING', decision_ref: null }, replacement_build_spec_required: true,
      upstream_working_commit: null, replacement_build_spec: null, verification: []
    });
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status = 'BLOCKED';
    td.tasks[0].blocked_by = ['BF-902'];
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.status = 'BLOCKED';
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const cs = readJson('delivery/CURRENT-SPRINT.json');
    cs.status = 'BLOCKED';
    cs.reason = 'FAKE E2E design delta candidate.';
    writeJson('delivery/CURRENT-SPRINT.json', cs);
    const h = commitAll('fake: block task and create design delta');
    expectGatePass('Slow Loop BLOCK + Finding + Design Delta', base, h);
  }

  // 6) Human-approved rebaseline while Sprint is BLOCKED.
  {
    const base = head();
    const d = readJson(`delivery/deltas/${DELTA}.json`);
    d.status = 'APPROVED';
    d.user_decision = { status: 'APPROVED', decision_ref: 'CHAT-20260925-FAKE-E2E-DESIGN-DELTA' };
    d.upstream_working_commit = WORKING_V2;
    d.replacement_build_spec = BS2;
    writeJson(`delivery/deltas/${DELTA}.json`, d);
    writeBaseline({
      id: BS2, sourceCommit: WORKING_V2, supersedes: BS1, approvedDeltaIds: [DELTA],
      decisionRef: 'CHAT-20260925-FAKE-E2E-REBASELINE', contractText: 'Version 2: return OK-V2.'
    });
    writeJson(`build-spec/activations/${BS2}.json`, {
      schema_version: 1, baseline_id: BS2, previous_baseline: BS1, type: 'REBASELINE', status: 'USER_APPROVED',
      decision_ref: 'CHAT-20260925-FAKE-E2E-REBASELINE', approved_delta_ids: [DELTA],
      source_working_commit: WORKING_V2, activated_at: now
    });
    writeJson('build-spec/CURRENT.json', {
      schema_version: 1, active_baseline: BS2, implementation_enabled: true,
      reason: 'FAKE E2E rebaseline while Sprint remains BLOCKED.'
    });
    const q = readJson('delivery/backlog/QUEUE.json');
    q.build_spec_id = BS2;
    q.items[0].build_spec_id = BS2;
    writeJson('delivery/backlog/QUEUE.json', q);
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.build_spec_id = BS2;
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].build_spec_id = BS2;
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    const cs = readJson('delivery/CURRENT-SPRINT.json');
    cs.active_build_spec = BS2;
    writeJson('delivery/CURRENT-SPRINT.json', cs);
    const h = commitAll('fake: approved rebaseline');
    expectGatePass('Blocked Sprint Rebaseline', base, h);
  }

  // 7) Resume the same Sprint/Task on the replacement baseline.
  {
    const base = head();
    const finding = readJson('delivery/findings/BF-902.json');
    finding.status = 'RESOLVED';
    writeJson('delivery/findings/BF-902.json', finding);
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.status = 'ACTIVE';
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status = 'IN_PROGRESS';
    td.tasks[0].blocked_by = [];
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    const cs = readJson('delivery/CURRENT-SPRINT.json');
    cs.status = 'ACTIVE';
    cs.reason = 'FAKE E2E resumed after approved rebaseline.';
    writeJson('delivery/CURRENT-SPRINT.json', cs);
    const h = commitAll('fake: resume sprint after rebaseline');
    expectGatePass('Resume after Rebaseline', base, h);
  }

  // 8) Implement v2 contract under the replacement baseline.
  {
    const base = head();
    write('src/fake-e2e/feature.mjs', `export const fakeValue = () => 'OK-V2';\n`);
    write('tests/unit/fake-e2e.test.mjs', `import assert from 'node:assert/strict';\nimport { fakeValue } from '../../src/fake-e2e/feature.mjs';\nassert.equal(fakeValue(), 'OK-V2');\nconsole.log('fake unit v2 PASS');\n`);
    writeJson(`delivery/evidence/EV-${SP}-${TASK}-002.json`, {
      schema_version: 1, evidence_id: `EV-${SP}-${TASK}-002`, kind: 'TEST_RESULT', build_spec_id: BS2,
      sprint_id: SP, task_id: TASK, acceptance_ids: [AC], test_ids: [TEST], status: 'PASS',
      locator: 'command://node-tests-unit-fake-e2e-pass-v2', sha256: null, recorded_at: now
    });
    const h = commitAll('fake: implement replacement baseline');
    expectGatePass('Replacement-baseline implementation scope', base, h);
    const t = run('node', ['tests/unit/fake-e2e.test.mjs']);
    record('Replacement-baseline mapped test', t.status === 0, t.status === 0 ? 'test passed' : `${t.stdout}\n${t.stderr}`.slice(-1500));
  }

  // 9) Review with completion evidence.
  {
    const base = head();
    writeJson(`delivery/evidence/EV-${SP}-${TASK}-003.json`, {
      schema_version: 1, evidence_id: `EV-${SP}-${TASK}-003`, kind: 'REVIEW', build_spec_id: BS2,
      sprint_id: SP, task_id: TASK, acceptance_ids: [AC], test_ids: [TEST], status: 'PASS',
      locator: 'fake-e2e://review-pass', sha256: null, recorded_at: now
    });
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status = 'REVIEW';
    td.tasks[0].completion_evidence = [`EV-${SP}-${TASK}-002`, `EV-${SP}-${TASK}-003`];
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.status = 'REVIEW';
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const cs = readJson('delivery/CURRENT-SPRINT.json');
    cs.status = 'REVIEW';
    writeJson('delivery/CURRENT-SPRINT.json', cs);
    const h = commitAll('fake: review sprint task');
    expectGatePass('Review + Completion Evidence', base, h);
  }

  // 10) Close Sprint, close Delta, reset runtime state to HOLD.
  {
    const base = head();
    const td = readJson(`delivery/sprints/${SP}/tasks.json`);
    td.tasks[0].status = 'CLOSED';
    writeJson(`delivery/sprints/${SP}/tasks.json`, td);
    const sm = readJson(`delivery/sprints/${SP}/manifest.json`);
    sm.status = 'CLOSED';
    writeJson(`delivery/sprints/${SP}/manifest.json`, sm);
    const f = readJson('delivery/findings/BF-902.json');
    f.status = 'RESOLVED';
    writeJson('delivery/findings/BF-902.json', f);
    const d = readJson(`delivery/deltas/${DELTA}.json`);
    d.status = 'CLOSED';
    d.verification = [`EV-${SP}-${TASK}-003`];
    writeJson(`delivery/deltas/${DELTA}.json`, d);
    const implementationCommit = head();
    writeJson(`delivery/sprints/${SP}/gate-result.json`, {
      schema_version: 1, sprint_id: SP, build_spec_id: BS2, status: 'PASS', implementation_commit: implementationCommit,
      verified_at: now, required_acceptance_passed: true, regression_passed: true,
      blocking_findings: [], open_design_deltas: []
    });
    const q = readJson('delivery/backlog/QUEUE.json');
    q.items[0].status = 'DONE';
    writeJson('delivery/backlog/QUEUE.json', q);
    writeJson('delivery/CURRENT-SPRINT.json', {
      schema_version: 1, active_sprint: null, active_build_spec: null, active_task: null, status: 'HOLD',
      automation_mode: 'SAFE_AUTOMATION', reason: 'FAKE E2E Sprint closed.'
    });
    const current = readJson('build-spec/CURRENT.json');
    current.implementation_enabled = false;
    current.reason = 'FAKE E2E Sprint closed; no active implementation.';
    writeJson('build-spec/CURRENT.json', current);
    const h = commitAll('fake: close sprint');
    expectGatePass('Sprint Close + HOLD Reset', base, h);
  }

  // 11) Validate an approved fake Release Manifest without deploying anything.
  {
    const base = head();
    writeJson('releases/manifests/REL-P9-901.json', {
      schema_version: 1, release_id: 'REL-P9-901', status: 'RELEASE_READY', build_spec_id: BS2,
      source_commit: base, sprint_ids: [SP], approval: { status: 'USER_APPROVED', decision_ref: 'CHAT-20260925-FAKE-E2E-RELEASE' },
      targets: [
        { target_id: 'database', type: 'SUPABASE_MIGRATIONS', enabled: false, migrations_path: 'supabase/migrations', migration_policy: 'FORWARD_COMPATIBLE_EXPAND_ONLY', human_reviewed: false },
        { target_id: 'edge', type: 'CLOUDFLARE_WORKER', enabled: false, config_path: 'wrangler.jsonc' },
        { target_id: 'web', type: 'CLOUDFLARE_PAGES', enabled: true, artifact_path: 'dist' }
      ],
      health_checks: [{ name: 'web-root', base_url_env: 'DEPLOY_BASE_URL', path: '/', expected_status: [200], attempts: 6, interval_ms: 5000 }],
      rollback: { cloudflare_code_auto: true, database_auto: false, database_strategy: 'FORWARD_ONLY' }
    });
    const h = commitAll('fake: validate release gate');
    expectGatePass('Fake Release Gate', base, h);
  }

  const summary = {
    fixture: 'ephemeral',
    fake_data_persisted: false,
    structural_sequence_completed: true,
    operating_e2e_verdict: 'PASS',
    blocker: null,
    results
  };
  console.log('FAKE_SPRINT_E2E_RESULT=' + JSON.stringify(summary));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('CLEANUP :: ephemeral fixture deleted');
}
