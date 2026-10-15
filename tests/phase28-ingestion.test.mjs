import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
const worker=createRequire(import.meta.url)('./.compiled/index.js').default;
const admin='proofatlas-acceptance-root';
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 for(const name of readdirSync('migrations').filter(s=>s.endsWith('.sql')).sort())db.exec(readFileSync('migrations/'+name,'utf8'));
 const env={ADMIN_TOKEN:admin,FREE_AI_ENABLED:'false',DB:{prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)??null},async all(){return{results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return{meta:{changes:r.changes}}}}}}};
 return{db,env};
}
async function request(env,path,body,method){const req=new Request('https://test.example'+path,{method:method||(body===undefined?'GET':'POST'),headers:{Authorization:'Bearer '+admin,...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});const r=await worker.fetch(req,env);return{status:r.status,body:await r.json()};}
test('fully indexed document becomes searchable only after ready transition',async()=>{
 const f=fixture();try{
  const document=await request(f.env,'/api/documents',{title:'Procurement agreement',classification:'public',content:'ABC renewal contract CTR-24680 includes a unique remuneration clause.'});
  assert.equal(document.status,201);assert.equal(document.body.state,'ready');
  const row=f.db.prepare('SELECT state,finished_at FROM document_ingestion WHERE document_id=?').get(document.body.id);
  assert.equal(row.state,'ready');assert.ok(row.finished_at);
  const search=await request(f.env,'/api/search',{query:'remuneration clause'});assert.equal(search.status,200);
  assert.ok(search.body.evidence.some(e=>e.document_id===document.body.id));
 }finally{f.db.close()}
});
test('partially indexed documents cannot appear in main retrieval or evidence indexes',async()=>{
 const f=fixture();try{
  f.db.prepare("INSERT INTO document_ingestion VALUES(?,'staging',?,NULL)").run('partial','2026-01-01');
  f.db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?)').run('partial','Unfinished','manual','public','Exclusive staging phrase clientname','2026-01-01');
  f.db.prepare('INSERT INTO chunks VALUES(?,?,?,?)').run('part-chunk','partial',0,'Exclusive staging phrase clientname');
  f.db.prepare('INSERT INTO entities VALUES(?,?,?,?)').run('part-entity','partial','contract','CTR-999');
  const search=await request(f.env,'/api/search',{query:'clientname'});
  assert.equal(search.status,200);assert.ok(!search.body.evidence.some(e=>e.document_id==='partial'));
  const list=await request(f.env,'/api/documents');assert.ok(!list.body.items.some(x=>x.id==='partial'));
  assert.equal((await request(f.env,'/api/documents/partial')).status,404);
  assert.equal((await request(f.env,'/api/retrieval/evaluate',{checks:[{query:'clientname',expected_document_ids:['partial']}]})).status,422);
  const overview=await request(f.env,'/api/overview');assert.equal(overview.body.metrics[0].value,0);
 }finally{f.db.close()}
});
test('interrupted indexing fails closed and maintenance removes abandoned staging records',async()=>{
 const f=fixture();try{
  f.db.exec("CREATE TRIGGER fail_index BEFORE INSERT ON chunks BEGIN SELECT RAISE(ABORT,'index unavailable'); END;");
  const attempted=await request(f.env,'/api/documents',{title:'Interrupted import',content:'A rare clause that should never become searchable.'});
  assert.equal(attempted.status,500);
  const stage=f.db.prepare("SELECT document_id,state FROM document_ingestion WHERE state='staging'").get();assert.equal(stage.state,'staging');
  assert.equal((await request(f.env,'/api/documents')).body.items.length,0);
  f.db.exec('DROP TRIGGER fail_index');
  f.db.prepare('UPDATE document_ingestion SET started_at=? WHERE document_id=?').run('2000-01-01T00:00:00.000Z',stage.document_id);
  await worker.scheduled({cron:'0 4 * * *'},f.env);
  assert.equal(f.db.prepare('SELECT count(*) n FROM document_ingestion').get().n,0);
  assert.equal(f.db.prepare('SELECT count(*) n FROM documents').get().n,0);
 }finally{f.db.close()}
});
