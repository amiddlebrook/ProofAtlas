import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const app=require('./.compiled/index.js');
const advanced=require('./.compiled/advanced.js');
function env(){const sql=new DatabaseSync(':memory:');for(const f of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('migrations/'+f,'utf8'));return {sql,DB:{prepare(q){let args=[];return {bind(...v){args=v;return this},async all(){return {results:sql.prepare(q).all(...args)}},async first(){return sql.prepare(q).get(...args)??null},async run(){const x=sql.prepare(q).run(...args);return {meta:{changes:x.changes}}}}}},FREE_AI_ENABLED:'true',AI:{async run(){return {response:'Fixture response'}}},stop(){sql.close()}}}
async function call(e,path,data,method){const req=new Request('http://localhost:8787'+path,{method:method||(data===undefined?'GET':'POST'),headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const res=await app.api(req,e,new URL(req.url));if(!res.ok)throw new Error(`${path} ${res.status} ${await res.text()}`);return res.json()}
async function rejected(e,path,data,status){const req=new Request('http://localhost:8787'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});await assert.rejects(()=>app.api(req,e,new URL(req.url)),ex=>ex.status===status)}
test('evidence snapshot matches content and detects source mutations',async()=>{const e=env();try{
const doc=await call(e,'/api/documents',{title:'Supply agreement',source:'unit-test',classification:'confidential',content:'Vendor will deliver 100 widgets by 2027-01-01 and be paid $5000.'});
const claim=await call(e,`/api/documents/${doc.id}/claims`,{quote:'100 widgets',assertion:'Vendor quantity'});assert.equal(claim.verified,true);
const snap=await call(e,'/api/provenance/snapshots',{label:'Source freeze 1'});assert.equal(snap.claim_count,1);assert.equal(snap.sha256.length,64);
const initial=await call(e,`/api/provenance/snapshots/${snap.id}/verify`,{});assert.equal(initial.verified,true);
const manifest=await call(e,'/api/provenance/snapshots');assert.equal(manifest.items.length,1);
e.sql.prepare('UPDATE chunks SET body=? WHERE document_id=?').run('tampered text',doc.id);
const changed=await call(e,`/api/provenance/snapshots/${snap.id}/verify`,{});assert.equal(changed.verified,false);
const report=await call(e,'/api/provenance/report');assert.equal(report.verified,0);assert.equal(report.findings[0].verified,false);
}finally{e.stop()}});
