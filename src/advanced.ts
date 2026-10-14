import {body,first,list,execute,uid,now,json,required,fail,limit,type Env} from './core';
type Chunk={id:string,document_id:string,ordinal:number,body:string};
type Claim={id:string,document_id:string,chunk_id:string,quote:string,assertion:string,sha256:string};
export async function fingerprint(value:string):Promise<string>{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('')}
export function locateQuote(chunk:string,quote:string):{offset:number,length:number}|null{const offset=chunk.indexOf(quote);return offset===-1?null:{offset,length:quote.length}}
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
 return null;
}
