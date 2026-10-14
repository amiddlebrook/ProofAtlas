import {body,first,list,execute,uid,now,json,required,fail,limit,type Env} from './core';
type Chunk={id:string,document_id:string,ordinal:number,body:string};
type Claim={id:string,document_id:string,chunk_id:string,quote:string,assertion:string,sha256:string};
export async function fingerprint(value:string):Promise<string>{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('')}
export function locateQuote(chunk:string,quote:string):{offset:number,length:number}|null{const offset=chunk.indexOf(quote);return offset===-1?null:{offset,length:quote.length}}

async function collectionManifest(env:Env){
 const documents=await list<{id:string;content:string;classification:string;title:string}>(env,'SELECT id,title,classification,content FROM documents ORDER BY id');
 const chunks=await list<{id:string;document_id:string;ordinal:number;body:string}>(env,'SELECT id,document_id,ordinal,body FROM chunks ORDER BY document_id,ordinal,id');
 const claims=await list<{id:string;document_id:string;chunk_id:string;quote:string;assertion:string;sha256:string}>(env,'SELECT id,document_id,chunk_id,quote,assertion,sha256 FROM claims ORDER BY id');
 const canonical=JSON.stringify({schema:1,documents,chunks,claims});
 return {schema_version:1,document_count:documents.length,claim_count:claims.length,sha256:await fingerprint(canonical)};
}
export async function advancedApi(req:Request,env:Env,url:URL):Promise<Response|null>{
 const p=url.pathname,m=req.method;
 if(p==='/api/claims'&&m==='GET')return json({items:await list(env,'SELECT c.id,c.assertion,c.quote,c.source_classification,c.created_at,d.title document,c.document_id,c.chunk_id FROM claims c JOIN documents d ON d.id=c.document_id ORDER BY c.created_at DESC LIMIT ?',limit(url))});
 const add=p.match(/^\/api\/documents\/([^/]+)\/claims$/);
 if(add&&m==='POST'){
  const doc=await first<{id:string,classification:string}>(env,'SELECT id,classification FROM documents WHERE id=?',add[1]);if(!doc)fail(404,'Document not found');
  const b=await body(req),quote=required(b.quote,'quote',1200),assertion=required(b.assertion,'assertion',1000);
  const passages=await list<Chunk>(env,'SELECT id,document_id,ordinal,body FROM chunks WHERE document_id=? ORDER BY ordinal',doc.id);
  const matching=passages.find(c=>locateQuote(c.body,quote)!==null);
  if(!matching)fail(422,'Exact quote must occur in one stored source passage');
  const id=uid(),hash=await fingerprint(matching.body);
  await execute(env,'INSERT INTO claims VALUES(?,?,?,?,?,?,?,?)',id,doc.id,matching.id,quote,assertion,hash,doc.classification,now());
  return json({id,document_id:doc.id,chunk_id:matching.id,quote,offset:locateQuote(matching.body,quote)?.offset,sha256:hash,verified:true},201);
 }
 const check=p.match(/^\/api\/claims\/([^/]+)\/verify$/);
 if(check&&m==='GET'){
  const claim=await first<Claim>(env,'SELECT * FROM claims WHERE id=?',check[1]);if(!claim)fail(404,'Claim not found');
  const chunk=await first<Chunk>(env,'SELECT * FROM chunks WHERE id=? AND document_id=?',claim.chunk_id,claim.document_id);
  const present=Boolean(chunk&&locateQuote(chunk.body,claim.quote));const intact=Boolean(chunk&&await fingerprint(chunk.body)===claim.sha256);
  return json({id:claim.id,verified:present&&intact,source_present:present,source_unchanged:intact,document_id:claim.document_id,chunk_id:claim.chunk_id,offset:chunk?locateQuote(chunk.body,claim.quote)?.offset??null:null});
 }

 if(p==='/api/provenance/snapshots'&&m==='GET')return json({items:await list(env,'SELECT id,label,document_count,claim_count,manifest_hash,created_at FROM provenance_snapshots ORDER BY created_at DESC LIMIT ?',limit(url))});
 if(p==='/api/provenance/snapshots'&&m==='POST'){
  const b=await body(req);const label=required(b.label,'label',160);
  const manifest=await collectionManifest(env);const id=uid(),created=now();
  await execute(env,'INSERT INTO provenance_snapshots VALUES(?,?,?,?,?,?)',id,label,manifest.document_count,manifest.claim_count,manifest.sha256,created);
  return json({id,label,...manifest,created_at:created},201);
 }
 const verify=p.match(/^\/api\/provenance\/snapshots\/([^/]+)\/verify$/);
 if(verify&&m==='POST'){
  const anchor=await first<{id:string;manifest_hash:string;document_count:number;claim_count:number}>(env,'SELECT * FROM provenance_snapshots WHERE id=?',verify[1]);if(!anchor)fail(404,'Evidence snapshot not found');
  const current=await collectionManifest(env);
  return json({id:anchor.id,verified:anchor.manifest_hash===current.sha256,original:anchor.manifest_hash,current:current.sha256,document_count:current.document_count,claim_count:current.claim_count,reason:anchor.manifest_hash===current.sha256?'Collection matches anchored digest':'Evidence collection changed after snapshot; review document and claim mutations'});
 }
 if(p==='/api/provenance/report'&&m==='GET'){
  const claims=await list<{id:string;document_id:string;chunk_id:string;quote:string;sha256:string;body:string|null}>(env,'SELECT c.*, k.body FROM claims c LEFT JOIN chunks k ON k.id=c.chunk_id ORDER BY c.created_at DESC LIMIT 200');
  const findings=await Promise.all(claims.map(async c=>({claim_id:c.id,document_id:c.document_id,verified:!!(c.body&&locateQuote(c.body,c.quote)&&await fingerprint(c.body)===c.sha256)})));
  return json({checked:findings.length,verified:findings.filter(f=>f.verified).length,findings,limited_to_recent:200});
 }
 return null;
}
