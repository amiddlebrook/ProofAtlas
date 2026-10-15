import {body,first,list,execute,json,required,fail,now,uid,type Env} from './core';
export async function decisionApi(req:Request,env:Env,url:URL):Promise<Response|null>{
 const p=url.pathname,m=req.method;
 if(p==='/api/decision/casebooks'&&m==='GET')return json({items:await list(env,'SELECT c.*,COUNT(DISTINCT s.document_id) source_count FROM investigation_cases c LEFT JOIN investigation_sources s ON s.case_id=c.id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 100')});
 if(p==='/api/decision/casebooks'&&m==='POST'){
  const b=await body(req,10000);const id=uid();await execute(env,'INSERT INTO investigation_cases VALUES(?,?,?,?,?,?)',id,required(b.title,'title',160),required(b.question,'question',1200),'open',now(),now());return json({id},201);
 }
 const match=p.match(/^\/api\/decision\/casebooks\/([0-9a-f-]{36})$/);
 if(match&&m==='GET'){
  const row=await first(env,'SELECT * FROM investigation_cases WHERE id=?',match[1]);if(!row)fail(404,'Casebook not found');
  return json({case:row,sources:await list(env,'SELECT s.document_id,s.rationale,s.added_at,d.title,d.source,d.classification FROM investigation_sources s JOIN ready_documents d ON d.id=s.document_id WHERE s.case_id=? ORDER BY s.added_at',match[1]),notes:await list(env,'SELECT id,note,created_at FROM investigation_notes WHERE case_id=? ORDER BY created_at DESC LIMIT 150',match[1])});
 }
 const source=p.match(/^\/api\/decision\/casebooks\/([0-9a-f-]{36})\/sources$/);
 if(source&&m==='POST'){
  const b=await body(req,12000);const casebook=await first<{status:string}>(env,'SELECT status FROM investigation_cases WHERE id=?',source[1]);if(!casebook)fail(404,'Casebook not found');if(casebook.status==='closed')fail(409,'Closed casebooks are read-only');
  const documentId=required(b.document_id,'document_id',100);if(!await first(env,'SELECT id FROM ready_documents WHERE id=?',documentId))fail(404,'Document not found');
  const rationale=required(b.rationale,'rationale',1600);const statement=await env.DB.prepare('INSERT OR IGNORE INTO investigation_sources(case_id,document_id,rationale,added_at) VALUES(?,?,?,?)').bind(source[1],documentId,rationale,now()).run();if(!statement.meta?.changes)fail(409,'Source is already attached');return json({attached:true},201);
 }
 const note=p.match(/^\/api\/decision\/casebooks\/([0-9a-f-]{36})\/notes$/);
 if(note&&m==='POST'){
  const b=await body(req,10000);const c=await first<{status:string}>(env,'SELECT status FROM investigation_cases WHERE id=?',note[1]);if(!c)fail(404,'Casebook not found');if(c.status==='closed')fail(409,'Closed casebooks are read-only');
  const id=uid();await execute(env,'INSERT INTO investigation_notes VALUES(?,?,?,?)',id,note[1],required(b.note,'note',2500),now());return json({id},201);
 }
 const close=p.match(/^\/api\/decision\/casebooks\/([0-9a-f-]{36})\/close$/);
 if(close&&m==='POST'){
  const result=await env.DB.prepare("UPDATE investigation_cases SET status='closed',updated_at=? WHERE id=? AND status='open'").bind(now(),close[1]).run();if(!result.meta?.changes)fail(409,'Casebook is missing or already closed');return json({closed:true});
 }
 if(p.startsWith('/api/decision/'))fail(404,'Unknown casebook endpoint');return null;
}
