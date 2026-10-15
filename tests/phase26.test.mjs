import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const app=require('./.compiled/index.js');
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync('migrations').filter(s=>s.endsWith('.sql')).sort())db.exec(readFileSync('migrations/'+name,'utf8'));
 let aiCalls=0;
 const env={ADMIN_TOKEN:'phase26-fixture-root-secret',FREE_AI_ENABLED:'false',DB:{prepare(sql){let args=[];return{bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)??null},async all(){return{results:db.prepare(sql).all(...args)}},async run(){const x=db.prepare(sql).run(...args);return{meta:{changes:x.changes}}}}}},AI:{async run(){aiCalls++;return{response:'AI should not be invoked'}}}};
 return {db,env,get aiCalls(){return aiCalls},close(){db.close()}};
}
async function call(f,path,payload,method){const url=new URL('http://localhost:8787'+path);const req=new Request(url,{method:method||(payload===undefined?'GET':'POST'),headers:payload===undefined?{}:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload)});return app.api(req,f.env,url).then(async res=>({status:res.status,data:await res.json()}));}
async function rejects(f,path,payload,status,method){await assert.rejects(()=>call(f,path,payload,method),e=>e.status===status)}
test('ground-truth retrieval report makes no inference calls or writes',async()=>{
 const f=fixture();try{
 const doc=(await call(f,'/api/documents',{title:'Policy manual',source:'fixture',classification:'public',content:'Payment reconciliation instructions for payable invoice settlement and approvals.'})).data;
 const report=(await call(f,'/api/retrieval/evaluate',{k:3,checks:[{query:'invoice settlement',expected_document_ids:[doc.id]}]})).data;
 assert.equal(report.total_cases,1);assert.equal(report.inference_calls,0);assert.equal(report.persisted,false);
 assert.ok(report.macro_recall_at_k>=0&&report.macro_recall_at_k<=1);
 assert.equal(report.cases[0].expected_document_ids[0],doc.id);
 assert.equal(f.aiCalls,0);
 await rejects(f,'/api/retrieval/evaluate',{k:5,checks:[{query:'policy',expected_document_ids:['made-up-document']}]},422);
 await rejects(f,'/api/retrieval/evaluate',{k:9,checks:[{query:'policy',expected_document_ids:[doc.id]}]},400);
 }finally{f.close()}
});
