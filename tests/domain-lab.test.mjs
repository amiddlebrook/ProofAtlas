import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const worker=require('./.compiled/index.js').default;
const domain=require('./.compiled/domain-lab.js');
const rootToken='phase22-test-root-secret';
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('migrations/'+file,'utf8'));
 const env={ADMIN_TOKEN:rootToken,DB:{prepare(sql){let x=[];return{bind(...args){x=args;return this},async first(){return db.prepare(sql).get(...x)??null},async all(){return{results:db.prepare(sql).all(...x)}},async run(){const result=db.prepare(sql).run(...x);return{meta:{changes:result.changes}}}}}}};
 return{db,env};
}
async function call(env,path,method='GET',data,token=rootToken){
 const req=new Request('https://tests.workers.dev'+path,{method,headers:{Authorization:'Bearer '+token,...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await worker.fetch(req,env);
 return{status:result.status,body:await result.json()};
}

test('citation verifier distinguishes altered source and classification drift',async()=>{
 const {fingerprint}=require('./.compiled/advanced.js');const body='A documented public finding';
 const row={id:'c',document_id:'d',chunk_document_id:'d',quote:'public finding',assertion:'Claim',sha256:await fingerprint(body),body,source_classification:'public',document_classification:'public',title:'Source'};
 const valid=await domain.verifyCitation(row);assert.equal(valid.verified,true);assert.equal(valid.source_offset,13);
 const tampered=await domain.verifyCitation({...row,body:'No supporting information',document_classification:'confidential'});
 assert.equal(tampered.verified,false);assert.ok(tampered.findings.includes('digest_changed'));assert.ok(tampered.findings.includes('quote_missing'));assert.ok(tampered.findings.includes('classification_changed'));
});
test('citation ledger detects modified stored text without mutating provenance',async()=>{
 const{db,env}=fixture();try{
 const {fingerprint}=require('./.compiled/advanced.js');const passage='Auditable receipt sent Tuesday';const hash=await fingerprint(passage);
 db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?)').run('d','Receipt','manual','public',passage,'2026');
 db.prepare('INSERT INTO chunks VALUES(?,?,?,?)').run('k','d',0,passage);
 db.prepare('INSERT INTO claims VALUES(?,?,?,?,?,?,?,?)').run('c','d','k','receipt sent','Receipt was sent',hash,'public','2026');
 const before=await call(env,'/api/lab/citations');assert.equal(before.status,200);assert.equal(before.body.verified,1);
 db.prepare('UPDATE chunks SET body=? WHERE id=?').run('Now changed','k');
 const after=await call(env,'/api/lab/citations');assert.equal(after.body.at_risk,1);assert.ok(after.body.findings[0].findings.includes('digest_changed'));
 assert.equal(db.prepare('SELECT count(*) n FROM claims').get().n,1);
 }finally{db.close()}
});
