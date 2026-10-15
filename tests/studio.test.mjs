import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {studioApi}=require('./.compiled/studio.js');
import {renderStudio} from '../public/studio.js';
function environment(){const db=new DatabaseSync(':memory:');for(const name of readdirSync('migrations').filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync('migrations/'+name,'utf8'));return {db,env:{DB:{prepare(q){let args=[];return {bind(...a){args=a;return this},async all(){return {results:db.prepare(q).all(...args)}},async first(){return db.prepare(q).get(...args)||null},async run(){const x=db.prepare(q).run(...args);return {meta:{changes:x.changes}}}}}}}}}
async function call(env,route,method='GET'){const req=new Request('http://localhost:8787'+route,{method});return studioApi(req,env,new URL(req.url))}

test('specialized ProofAtlas studio reads actual SQLite state',async()=>{
 const {db,env}=environment();try{db.exec(`INSERT INTO documents VALUES('d1','First','manual','internal','Contract #1','2026-01-01'); INSERT INTO documents VALUES('d2','Second','manual','public','Contract #2','2026-01-01'); INSERT INTO entities VALUES('e1','d1','contract','CTR-111'); INSERT INTO entities VALUES('e2','d2','contract','CTR-111');`);
 const response=await call(env,'/api/studio/evidence-map');assert.equal(response.status,200);const body=await response.json();assert.equal(body.documents.length,2);assert.equal(body.edges.length,1);assert.equal(body.edges[0].count,1);assert.equal(body.edges[0].terms[0],'contract: ctr-111');
 const denied=await call(env,'/api/studio/evidence-map','POST');assert.equal(denied.status,405);
 }finally{db.close()}
});
test('studio endpoints require a dedicated protected route and a working JS module',async()=>{const {db,env}=environment();try{assert.equal(await call(env,'/api/studio/missing'),null);assert.equal(typeof renderStudio,'function');}finally{db.close()}});
import {connectedDocuments} from '../public/studio.js';
test('relationship inspector only shows connected records',()=>assert.equal(connectedDocuments([{source:'a',target:'b',count:2},{source:'c',target:'d',count:1}],'a')[0].other,'b'));
