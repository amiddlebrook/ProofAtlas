import {list,json,type Env} from './core';
export async function studioApi(req:Request,env:Env,url:URL):Promise<Response|null>{
 if(url.pathname!=='/api/studio/evidence-map')return null;
 if(req.method!=='GET')return Response.json({error:'Method not allowed'},{status:405});
 const [documents,entities,claims]=await Promise.all([
  list<{id:string;title:string;classification:string;source:string;characters:number}>(env,'SELECT id,title,classification,source,LENGTH(content) characters FROM ready_documents ORDER BY created_at DESC LIMIT 80'),
  list<{document_id:string;kind:string;value:string}>(env,'SELECT document_id,kind,value FROM entities ORDER BY document_id,kind,value LIMIT 700'),
  list<{document_id:string;n:number}>(env,'SELECT document_id,COUNT(*) n FROM claims GROUP BY document_id LIMIT 80')
 ]);
 const allowed=new Set(documents.map(d=>d.id));
 const mapped=entities.filter(e=>allowed.has(e.document_id));
 const byValue=new Map<string,Set<string>>();
 for(const e of mapped){const key=e.kind+'\u0000'+e.value.toLowerCase();if(!byValue.has(key))byValue.set(key,new Set());byValue.get(key)!.add(e.document_id)}
 const connections=new Map<string,{source:string;target:string;count:number;terms:string[]}>();
 for(const [key,docs] of byValue){const ids=[...docs].sort();if(ids.length>12)continue;for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const pair=ids[i]+'|'+ids[j];const edge=connections.get(pair)||{source:ids[i],target:ids[j],count:0,terms:[]};edge.count++;if(edge.terms.length<6)edge.terms.push(key.replace('\u0000',': '));connections.set(pair,edge)}}
 const counts=new Map(claims.map(c=>[c.document_id,c.n]));
 return json({documents:documents.map(d=>({...d,verified_claims:counts.get(d.id)||0})),edges:[...connections.values()].sort((a,b)=>b.count-a.count).slice(0,200),entities:mapped.length,limits:{documents:80,entities:700,edges:200},note:'Edges represent shared extracted entities, not verified semantic relationships. Click a source to inspect original content.'});
}
