import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const app=require('./.compiled/index.js');
const advanced=require('./.compiled/advanced.js');
function env(){
 const sql=new DatabaseSync(':memory:');
 for(const f of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('migrations/'+f,'utf8'));
 return { sql,DB:{prepare(query){let args=[];return {bind(...x){args=x;return this},async all(){return {results:sql.prepare(query).all(...args)}},async first(){return sql.prepare(query).get(...args)??null},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:r.changes}}}}}},FREE_AI_ENABLED:'true',AI:{async run(){return {response:'Fixture test response'}}},stop(){sql.close()}};
}
async function call(e,path,data,method){const request=new Request('http://localhost:8787'+path,{method:method||(data===undefined?'GET':'POST'),headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const response=await app.api(request,e,new URL(request.url));assert.ok(response.ok,`${path}: HTTP ${response.status}`);return response.json()}
async function rejection(e,path,data,status=400){const request=new Request('http://localhost:8787'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});await assert.rejects(()=>app.api(request,e,new URL(request.url)),err=>err.status===status)}
test('claims are exact-quote evidence with tamper detection',async()=>{
 const e=env();try{const d=await call(e,'/api/documents',{title:'Terms',source:'test',classification:'confidential',content:'Renewal date: 2027-01-01. Total $15000.'});
 await rejection(e,`/api/documents/${d.id}/claims`,{assertion:'Invented date',quote:'2028-01-01'},422);
 const claim=await call(e,`/api/documents/${d.id}/claims`,{assertion:'Renewal in 2027',quote:'2027-01-01'});
 assert.equal(claim.verified,true);assert.equal(claim.sha256.length,64);
 const verified=await call(e,`/api/claims/${claim.id}/verify`);assert.equal(verified.verified,true);
 e.sql.prepare('UPDATE chunks SET body=? WHERE id=?').run('Renewal date: 2029-01-01.',claim.chunk_id);
 const broken=await call(e,`/api/claims/${claim.id}/verify`);assert.equal(broken.verified,false);assert.equal(broken.source_unchanged,false);
 }finally{e.stop()}
});
