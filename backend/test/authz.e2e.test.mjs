// Teste de autorizare pe API-ul real (serverul trebuie sa ruleze: npm run start:dev).
// Creeaza date izolate (prefix zz-authz), verifica matricea de permisiuni si sterge totul la final.
// Rulare, din backend/:  npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const API = process.env.TEST_API_URL || 'http://localhost:4000/api/v1';
const db = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const PW = randomBytes(12).toString('hex');
const ids = {}; const tokens = {};
let tmpDir;

const q = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];

async function call(who, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(tokens[who] ? { Authorization: `Bearer ${tokens[who]}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* raspuns fara corp JSON */ }
  return { status: res.status, data: json?.data ?? json };
}
const status = async (...args) => (await call(...args)).status;

before(async () => {
  await db.connect();
  const hash = await bcrypt.hash(PW, 10);
  const mkUser = async (key, role) => {
    ids[key] = (await one(`INSERT INTO users ("firstName","lastName",email,password,status,role)
      VALUES ($1,'Test',$2,$3,'active',$4) RETURNING id`, [key, `zz-authz-${key}@example.test`, hash, role])).id;
  };
  await mkUser('admin', 'admin');
  await mkUser('coord', 'professor');      // coordonatorul proiectului
  await mkUser('prof2', 'professor');      // alt profesor, fara legatura cu proiectul
  await mkUser('leader', 'student');       // liderul echipei, creatorul proiectului
  await mkUser('member', 'student');       // membru al echipei
  await mkUser('outsider', 'student');     // student fara legatura cu proiectul
  await mkUser('stranger', 'student');     // alt student strain, neatins de celelalte teste

  ids.team = (await one(`INSERT INTO teams (name) VALUES ('zz-authz team') RETURNING id`)).id;
  await q(`INSERT INTO team_members ("teamId","userId",role) VALUES ($1,$2,'leader'),($1,$3,'member')`, [ids.team, ids.leader, ids.member]);
  const mkProject = async (status) => (await one(`INSERT INTO projects (title,description,status,"coordinatorId","createdById","teamId")
    VALUES ('zz-authz project','test',$1,$2,$3,$4) RETURNING id`, [status, ids.coord, ids.leader, ids.team])).id;
  ids.project = await mkProject('in_progress');
  ids.draft = await mkProject('draft');
  ids.task = (await one(`INSERT INTO tasks (title,"projectId","reporterId") VALUES ('zz task',$1,$2) RETURNING id`, [ids.project, ids.leader])).id;

  tmpDir = mkdtempSync(join(tmpdir(), 'zz-authz-'));
  const file = join(tmpDir, 'doc.txt');
  writeFileSync(file, 'continut secret');
  ids.doc = (await one(`INSERT INTO documents (name,filename,"originalName","mimeType",size,"storagePath","projectId","uploadedById")
    VALUES ('zz doc','doc.txt','doc.txt','text/plain',15,$1,$2,$3) RETURNING id`, [file, ids.project, ids.leader])).id;
  ids.notif = (await one(`INSERT INTO notifications ("userId",title,message) VALUES ($1,'zz','zz') RETURNING id`, [ids.leader])).id;

  for (const key of ['admin', 'coord', 'prof2', 'leader', 'member', 'outsider', 'stranger']) {
    const r = await call(null, 'POST', '/auth/login', { email: `zz-authz-${key}@example.test`, password: PW });
    assert.equal(r.status, 200, `login ${key}`);
    tokens[key] = r.data.accessToken;
  }
});

after(async () => {
  const users = Object.values(ids);
  await q(`DELETE FROM evaluation_revisions WHERE "evaluationId" IN (SELECT id FROM evaluations WHERE "projectId" = ANY($1))`, [[ids.project, ids.draft]]);
  await q(`DELETE FROM evaluation_criteria WHERE "evaluationId" IN (SELECT id FROM evaluations WHERE "projectId" = ANY($1))`, [[ids.project, ids.draft]]);
  for (const t of ['evaluations', 'comments', 'activities', 'tasks', 'milestones', 'ai_analyses']) {
    await q(`DELETE FROM ${t} WHERE "projectId" = ANY($1)`, [[ids.project, ids.draft]]);
  }
  await q(`DELETE FROM document_versions WHERE "documentId" IN (SELECT id FROM documents WHERE "projectId" = ANY($1))`, [[ids.project, ids.draft]]);
  await q(`DELETE FROM documents WHERE "projectId" = ANY($1)`, [[ids.project, ids.draft]]);
  await q(`DELETE FROM projects WHERE id = ANY($1)`, [[ids.project, ids.draft]]);
  await q(`DELETE FROM chat_messages WHERE "roomId" IN (SELECT id FROM chat_rooms WHERE "entityId" = ANY($1))`, [[ids.team, ids.project, ids.draft]]);
  await q(`DELETE FROM chat_rooms WHERE "entityId" = ANY($1)`, [[ids.team, ids.project, ids.draft]]);
  await q(`DELETE FROM team_join_requests WHERE "teamId" = $1`, [ids.team]);
  await q(`DELETE FROM team_members WHERE "teamId" = $1`, [ids.team]);
  await q(`DELETE FROM teams WHERE id = $1`, [ids.team]);
  await q(`DELETE FROM notifications WHERE "userId" = ANY($1)`, [users]);
  await q(`DELETE FROM users WHERE email LIKE 'zz-authz-%'`);
  await db.end();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

// ---------- Citire: echipa, coordonatorul si adminul vad; ceilalti primesc 404 ----------
const READ_ROUTES = () => [
  `/projects/${ids.project}`, `/projects/${ids.project}/comments`, `/projects/${ids.project}/milestones`,
  `/tasks/${ids.task}`, `/documents?projectId=${ids.project}`, `/documents/${ids.doc}/download`,
  `/evaluations?projectId=${ids.project}`, `/ai/history/${ids.project}`,
];

test('citire: admin, coordonator, lider si membru au acces', async () => {
  for (const who of ['admin', 'coord', 'leader', 'member']) {
    for (const route of READ_ROUTES()) assert.equal(await status(who, 'GET', route), 200, `${who} GET ${route}`);
  }
});

test('citire: studentul strain si alt profesor primesc 404', async () => {
  for (const who of ['outsider', 'prof2']) {
    for (const route of READ_ROUTES()) assert.equal(await status(who, 'GET', route), 404, `${who} GET ${route}`);
  }
});

test('listele nu contin proiecte sau task-uri straine', async () => {
  const projects = await call('outsider', 'GET', '/projects');
  assert.ok(!projects.data.data.some((p) => p.id === ids.project), 'proiect strain in lista');
  const tasks = await call('outsider', 'GET', '/tasks');
  assert.ok(!tasks.data.some((t) => t.id === ids.task), 'task strain in lista');
  const own = await call('member', 'GET', '/projects');
  assert.ok(own.data.data.some((p) => p.id === ids.project), 'membrul nu isi vede proiectul');
});

// ---------- Contributii ----------
test('membrul poate comenta si crea task-uri; strainul nu', async () => {
  assert.equal(await status('member', 'POST', `/projects/${ids.project}/comments`, { content: 'ok' }), 201);
  assert.equal(await status('outsider', 'POST', `/projects/${ids.project}/comments`, { content: 'x' }), 404);
  assert.equal(await status('member', 'POST', '/tasks', { title: 'zz nou', projectId: ids.project }), 201);
  assert.equal(await status('outsider', 'POST', '/tasks', { title: 'zz', projectId: ids.project }), 404);
  assert.equal(await status('outsider', 'PATCH', `/tasks/${ids.task}/status`, { status: 'done' }), 404);
});

test('reporterId vine din token, nu din cerere', async () => {
  // Campurile necunoscute sunt respinse de validare (DTO), nu ignorate
  assert.equal(await status('member', 'POST', '/tasks', { title: 'zz reporter', projectId: ids.project, reporterId: ids.coord }), 400);
  const r = await call('member', 'POST', '/tasks', { title: 'zz reporter', projectId: ids.project });
  assert.equal(r.status, 201);
  assert.equal((await one(`SELECT "reporterId" FROM tasks WHERE id=$1`, [r.data.id])).reporterId, ids.member);
});

// ---------- Proiect: echipa vs. coordonator ----------
test('echipa nu isi poate pune nota si nici schimba statusul dupa aprobare', async () => {
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.project}`, { status: 'completed' }), 403);
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.project}`, { finalGrade: 10 }), 200); // camp ignorat
  assert.equal((await one(`SELECT "finalGrade" FROM projects WHERE id=$1`, [ids.project])).finalGrade, null);
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.project}`, { title: 'alt titlu' }), 403);
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.project}`, { repository: 'https://git.example/x' }), 200);
});

test('echipa poate doar propune proiectul (draft -> proposed)', async () => {
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.draft}`, { status: 'approved' }), 403);
  assert.equal(await status('leader', 'PATCH', `/projects/${ids.draft}`, { status: 'proposed', title: 'titlu nou' }), 200);
  assert.equal((await one(`SELECT status FROM projects WHERE id=$1`, [ids.draft])).status, 'proposed');
});

test('coordonatorul schimba statusul si pune nota', async () => {
  assert.equal(await status('coord', 'PATCH', `/projects/${ids.project}`, { status: 'completed', finalGrade: 9.5 }), 200);
  const p = await one(`SELECT status, "finalGrade" FROM projects WHERE id=$1`, [ids.project]);
  assert.equal(p.status, 'completed');
  assert.equal(Number(p.finalGrade), 9.5);
  assert.equal(await status('outsider', 'PATCH', `/projects/${ids.project}`, { title: 'x' }), 404);
});

// ---------- Evaluari ----------
test('doar coordonatorul creeaza si completeaza evaluari; scorul e limitat la maxim', async () => {
  const body = { projectId: ids.project, phase: 'final', criteria: [{ name: 'Cod', maxScore: 10, weight: 1 }] };
  assert.equal(await status('leader', 'POST', '/evaluations', body), 403);
  assert.equal(await status('prof2', 'POST', '/evaluations', body), 404);
  const created = await call('coord', 'POST', '/evaluations', body);
  assert.equal(created.status, 201);
  const crit = created.data.criteria[0];
  assert.equal(await status('leader', 'PATCH', `/evaluations/${created.data.id}/complete`, { criteria: [{ id: crit.id, score: 10 }] }), 403);
  const done = await call('coord', 'PATCH', `/evaluations/${created.data.id}/complete`, { criteria: [{ id: crit.id, score: 999, maxScore: 999 }], generalFeedback: 'ok' });
  assert.equal(done.status, 200);
  assert.equal(Number(done.data.totalScore), 10);
  assert.equal(Number(done.data.maxScore), 10);
  // Dupa finalizare, modificarea e o corectura: fara motiv e refuzata, cu motiv se salveaza in istoric
  assert.equal(await status('coord', 'PATCH', `/evaluations/${created.data.id}/complete`, { criteria: [{ id: crit.id, score: 7 }] }), 400);
  const fixed = await call('coord', 'PATCH', `/evaluations/${created.data.id}/complete`,
    { criteria: [{ id: crit.id, score: 7 }], generalFeedback: 'ok', reason: 'Punctaj introdus gresit' });
  assert.equal(fixed.status, 200);
  assert.equal(Number(fixed.data.totalScore), 7);
  assert.equal(fixed.data.revisions.length, 1);
  assert.equal(Number(fixed.data.revisions[0].oldTotalScore), 10);
  assert.equal(fixed.data.revisions[0].reason, 'Punctaj introdus gresit');
  assert.equal(await status('leader', 'PATCH', `/evaluations/${created.data.id}/complete`, { criteria: [], reason: 'vreau nota mai mare' }), 403);
  const seen = await call('member', 'GET', `/evaluations?projectId=${ids.project}`);
  assert.equal(seen.data[0].revisions.length, 1, 'echipa vede istoricul corecturilor');
});

// ---------- Documente ----------
test('documentul il sterge doar cine l-a incarcat sau coordonatorul', async () => {
  assert.equal(await status('member', 'DELETE', `/documents/${ids.doc}`), 403);
  assert.equal(await status('outsider', 'DELETE', `/documents/${ids.doc}`), 404);
  assert.equal(await status('leader', 'DELETE', `/documents/${ids.doc}`), 200);
});

// ---------- Echipe ----------
test('echipa o administreaza liderul sau profesorii, nu membrii', async () => {
  assert.equal(await status('member', 'POST', `/teams/${ids.team}/members`, { userId: ids.outsider }), 403);
  assert.equal(await status('outsider', 'POST', `/teams/${ids.team}/members`, { userId: ids.outsider }), 403);
  assert.equal(await status('member', 'PATCH', `/teams/${ids.team}`, { name: 'x' }), 403);
  assert.equal(await status('outsider', 'GET', `/teams/${ids.team}/join-requests`), 403);
  // Un profesor fara legatura cu echipa nu o administreaza si nu ii vede conversatia; coordonatorul proiectului ei da
  assert.equal(await status('prof2', 'GET', `/teams/${ids.team}/join-requests`), 403);
  assert.equal(await status('prof2', 'POST', `/teams/${ids.team}/members`, { userId: ids.outsider }), 403);
  assert.equal(await status('prof2', 'PATCH', `/teams/${ids.team}`, { name: 'x' }), 403);
  assert.equal(await status('prof2', 'POST', '/chat/rooms', { entityId: ids.team, type: 'team' }), 404);
  assert.equal(await status('coord', 'GET', `/teams/${ids.team}/join-requests`), 200);
  assert.equal(await status('coord', 'POST', '/chat/rooms', { entityId: ids.team, type: 'team' }), 201);
  assert.equal(await status('leader', 'POST', `/teams/${ids.team}/members`, { userId: ids.outsider, role: 'leader' }), 400);
  assert.equal(await status('leader', 'POST', `/teams/${ids.team}/members`, { userId: ids.outsider }), 201);
  assert.equal((await one(`SELECT role FROM team_members WHERE "teamId"=$1 AND "userId"=$2`, [ids.team, ids.outsider])).role, 'member');
  assert.equal(await status('member', 'DELETE', `/teams/${ids.team}/members/${ids.leader}`), 403);
  assert.equal(await status('leader', 'DELETE', `/teams/${ids.team}/members/${ids.outsider}`), 200);
  assert.equal(await status('outsider', 'GET', '/teams/my-requests'), 200);
});

// ---------- Useri ----------
test('fiecare isi modifica doar propriul cont; rolul nu se poate schimba singur', async () => {
  assert.equal(await status('outsider', 'PATCH', `/users/${ids.leader}`, { firstName: 'x' }), 403);
  assert.equal(await status('outsider', 'PATCH', `/users/${ids.leader}/change-password`, { currentPassword: 'x', newPassword: 'yyyyyyyy' }), 403);
  // Rolul il poate schimba doar adminul (ignorat pentru restul); emailul nu se schimba deloc pe aceasta ruta
  assert.equal(await status('leader', 'PATCH', `/users/${ids.leader}`, { firstName: 'Lider', role: 'admin' }), 200);
  assert.equal(await status('leader', 'PATCH', `/users/${ids.leader}`, { firstName: 'Lider', email: 'x@example.test' }), 400);
  const u = await one(`SELECT role, email FROM users WHERE id=$1`, [ids.leader]);
  assert.equal(u.role, 'student');
  assert.equal(u.email, 'zz-authz-leader@example.test');
  assert.equal(await status('leader', 'POST', `/users/${ids.leader}/avatar`, { avatar: 'javascript:alert(1)' }), 400);
  assert.equal(await status('admin', 'PATCH', `/users/${ids.outsider}`, { role: 'professor' }), 200);
  assert.equal((await one(`SELECT role FROM users WHERE id=$1`, [ids.outsider])).role, 'professor');
});

test('notificarile altcuiva nu pot fi marcate ca citite', async () => {
  await call('member', 'PATCH', `/notifications/${ids.notif}/read`);
  assert.equal((await one(`SELECT "isRead" FROM notifications WHERE id=$1`, [ids.notif])).isRead, false);
});

// ---------- Notificari generate de server ----------
test('notificarile nu pot fi create de utilizatori obisnuiti', async () => {
  assert.equal(await status('member', 'POST', '/notifications', { userId: ids.outsider, title: 'fals', message: 'phishing' }), 403);
});

test('notificarile ajung doar la cei implicati in proiect', async () => {
  const count = async (who, title) => +(await one(`SELECT count(*) FROM notifications WHERE "userId"=$1 AND title LIKE $2`, [ids[who], title])).count;
  // Comentariul membrului: coordonatorul si liderul da, autorul si strainul nu
  assert.ok(await count('coord', 'Comentariu nou%') >= 1, 'coordonatorul nu a primit comentariul');
  assert.ok(await count('leader', 'Comentariu nou%') >= 1, 'liderul nu a primit comentariul');
  assert.equal(await count('member', 'Comentariu nou%'), 0, 'autorul si-a primit propriul comentariu');
  // Nota: echipa da (finalizare + corectura), strainul si alt profesor nu
  assert.ok(await count('member', 'Evaluare%') >= 2, 'echipa nu a primit nota');
  for (const who of ['stranger', 'prof2', 'admin']) assert.equal(await count(who, '%'), 0, `${who} a primit notificari straine`);
  // "outsider" a fost adaugat temporar in echipa de lider: primeste exact acea notificare, nimic despre proiect
  assert.equal(await count('outsider', 'Ai fost adaugat%'), 1);
  assert.equal(await count('outsider', 'Evaluare%') + await count('outsider', 'Comentariu%'), 0);
});

// ---------- Chat ----------
test('chat: doar membrii intra in conversatie; lista de camere nu mai da 500', async () => {
  const room = await call('member', 'POST', '/chat/rooms', { entityId: ids.team, type: 'team', memberIds: [ids.stranger] });
  assert.equal(room.status, 201);
  ids.room = room.data.id;
  assert.equal(await status('stranger', 'POST', '/chat/rooms', { entityId: ids.team, type: 'team' }), 404);
  assert.equal(await status('member', 'POST', `/chat/rooms/${ids.room}/messages`, { content: 'salut echipa' }), 201);
  assert.equal(await status('stranger', 'GET', `/chat/rooms/${ids.room}/messages`), 404);
  assert.equal(await status('stranger', 'POST', `/chat/rooms/${ids.room}/messages`, { content: 'intrus' }), 404);
  const rooms = await call('member', 'GET', '/chat/rooms');
  assert.equal(rooms.status, 200);
  assert.ok(rooms.data.some((r) => r.id === ids.room));
  const strangers = await call('stranger', 'GET', '/chat/rooms');
  assert.equal(strangers.status, 200);
  assert.ok(!strangers.data.some((r) => r.id === ids.room), 'strainul vede camera echipei');
  // memberIds trimis de client e ignorat: strainul nu a devenit membru
  assert.equal(+(await one(`SELECT count(*) FROM notifications WHERE "userId"=$1`, [ids.stranger])).count, 0);
  assert.ok(+(await one(`SELECT count(*) FROM notifications WHERE "userId"=$1 AND title='Mesaj nou'`, [ids.leader])).count >= 1, 'liderul nu a fost notificat de mesaj');
});

test('apel video: doar membrii primesc linkul, acelasi pentru toti, fara id-ul conversatiei in el', async () => {
  const a = await call('member', 'GET', `/chat/rooms/${ids.room}/call`);
  const b = await call('leader', 'GET', `/chat/rooms/${ids.room}/call`);
  assert.equal(a.status, 200);
  const room = (u) => new URL(u).pathname;
  assert.equal(room(a.data.url), room(b.data.url), 'membrii ajung in camere diferite');
  assert.ok(!a.data.url.includes(ids.room), 'id-ul conversatiei apare in link');
  assert.equal(await status('stranger', 'GET', `/chat/rooms/${ids.room}/call`), 404);
});

// ---------- Formatul erorilor ----------
test('erorile au cod stabil si mesaj prietenos; un id invalid da 404, nu 500', async () => {
  const raw = async (path, init) => { const r = await fetch(API + path, init); return { status: r.status, body: await r.json() }; };
  const h = { Authorization: `Bearer ${tokens.member}`, 'Content-Type': 'application/json' };
  const badId = await raw('/projects/nu-e-uuid', { headers: h });
  assert.equal(badId.status, 404);
  assert.equal(badId.body.code, 'NOT_FOUND');
  const foreign = await raw(`/projects/${ids.project}`, { headers: { Authorization: `Bearer ${tokens.stranger}` } });
  assert.equal(foreign.body.code, 'PROJECT_NOT_FOUND');
  assert.match(foreign.body.message, /Proiectul nu există/);
  const login = await raw('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'zz-authz-member@example.test', password: 'gresita' }) });
  assert.equal(login.body.code, 'INVALID_CREDENTIALS');
  const invalid = await raw('/users/me/pin', { method: 'PUT', headers: h, body: JSON.stringify({ currentPassword: PW, pin: 'abc' }) });
  assert.equal(invalid.body.code, 'VALIDATION_FAILED');
  assert.match(invalid.body.message, /PIN/, 'mesajul propriu (romana) inlocuit cu cel implicit (engleza)');
  const noAuth = await raw('/projects');
  assert.equal(noAuth.status, 401);
  assert.equal(noAuth.body.code, 'SESSION_EXPIRED');
});

// ---------- PIN de securitate ----------
test('PIN: activarea cere parola; login-ul nu da sesiune pana la PIN; biletul nu e token de sesiune', async () => {
  assert.equal(await status('stranger', 'PUT', '/users/me/pin', { currentPassword: 'gresita', pin: '4821' }), 400);
  assert.equal(await status('stranger', 'PUT', '/users/me/pin', { currentPassword: PW, pin: '12' }), 400);
  assert.equal(await status('stranger', 'PUT', '/users/me/pin', { currentPassword: PW, pin: '4821' }), 200);
  const me = await call('stranger', 'GET', '/users/me');
  assert.equal(me.data.isPinEnabled, true);
  assert.equal(me.data.pin, undefined, 'hash-ul PIN-ului a ajuns la client');

  const step1 = await call(null, 'POST', '/auth/login', { email: 'zz-authz-stranger@example.test', password: PW });
  assert.equal(step1.status, 200);
  assert.equal(step1.data.pinRequired, true);
  assert.equal(step1.data.accessToken, undefined, 'sesiune deschisa fara PIN');
  // Biletul pentru PIN nu functioneaza ca token de sesiune
  const asBearer = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${step1.data.pinToken}` } });
  assert.equal(asBearer.status, 401);

  assert.equal(await status(null, 'POST', '/auth/login/pin', { pinToken: step1.data.pinToken, pin: '0000' }), 401);
  const step2 = await call(null, 'POST', '/auth/login/pin', { pinToken: step1.data.pinToken, pin: '4821' });
  assert.equal(step2.status, 200);
  assert.ok(step2.data.accessToken, 'PIN corect fara sesiune');

  assert.equal(await status('stranger', 'DELETE', '/users/me/pin', { password: PW }), 200);
  const direct = await call(null, 'POST', '/auth/login', { email: 'zz-authz-stranger@example.test', password: PW });
  assert.ok(direct.data.accessToken, 'dupa dezactivare login-ul ar trebui sa fie direct');
});

// ---------- Stergerea proiectului ----------
test('echipa sterge proiectul doar in draft; coordonatorul oricand', async () => {
  assert.equal(await status('leader', 'DELETE', `/projects/${ids.project}`), 403);
  await q(`UPDATE projects SET status='draft' WHERE id=$1`, [ids.draft]);
  assert.equal(await status('leader', 'DELETE', `/projects/${ids.draft}`), 200);
  assert.equal(await status('coord', 'DELETE', `/projects/${ids.project}`), 200);
});
