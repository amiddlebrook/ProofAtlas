import {list,json,limit,type Env} from './core';
import {fingerprint,locateQuote} from './advanced';
type Row={id:string;document_id:string;chunk_id:string;quote:string;assertion:string;sha256:string;source_classification:string;body:string|null;chunk_document_id:string|null;document_classification:string|null;title:string|null};
export async function verifyCitation(row:Row){
 const found=!!row.body&&!!locateQuote(row.body,row.quote);
 const matchingSource=!!row.body&&row.document_id===row.chunk_document_id;
 const checksum=!!row.body&&await fingerprint(row.body)===row.sha256;
 const classification=!!row.document_classification&&row.source_classification===row.document_classification;
 const findings=[...(!matchingSource?['source_missing_or_mismatched']:[]),...(!found?['quote_missing']:[]),...(!checksum?['digest_changed']:[]),...(!classification?['classification_changed']:[])];
 return {claim_id:row.id,document_id:row.document_id,title:row.title??'(missing document)',assertion:row.assertion,source_offset:row.body?locateQuote(row.body,row.quote)?.offset??null:null,verified:findings.length===0,findings};
}
export async function domainLabApi(req:Request,env:Env,url:URL):Promise<Response|null>{
 if(url.pathname!=='/api/lab/citations'||req.method!=='GET')return null;
 const maximum=limit(url,100);
 const rows=await list<Row>(env,`SELECT c.id,c.document_id,c.chunk_id,c.quote,c.assertion,c.sha256,c.source_classification,k.body,k.document_id chunk_document_id,d.classification document_classification,d.title
 FROM claims c LEFT JOIN chunks k ON k.id=c.chunk_id LEFT JOIN documents d ON d.id=c.document_id ORDER BY c.created_at DESC,c.id DESC LIMIT ?`,maximum);
 const findings=await Promise.all(rows.map(verifyCitation));
 return json({checked:findings.length,verified:findings.filter(x=>x.verified).length,at_risk:findings.filter(x=>!x.verified).length,findings,scope:`Most recent ${maximum} claims; internal integrity check, not external authenticity verification`});
}
