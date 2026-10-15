const conf={"cls": "pa-dossier", "title": "THE INVESTIGATION DESK", "eyebrow": "PROOFATLAS  /  SOURCE ROOM", "tagline": "An evidence-first research assistant", "prompt": "Research question", "placeholder": "What source records support this claim, and where does the evidence stop?", "tools": "Indexed source tools", "noRecords": "Your casebook has no investigations yet", "mode": "EVIDENCE STANDARD", "status": "CASEBOOK INDEX", "button": "Open case file"};
const escSafe = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatDate = (value) => { const d=new Date(value); return Number.isFinite(d.valueOf())?d.toLocaleString():String(value??''); };
const encode = x => JSON.stringify(x,null,2);
function displayEvent(ev){
 const p=ev.payload || {};
 const obs=p.observation || {};
 const rows=Array.isArray(obs.rows)?obs.rows:[];
 const properties=rows.slice(0,8).map((row,i)=>{
    const vals=Object.entries(row).slice(0,7).map(([k,v])=>`<dt>${escSafe(k)}</dt><dd>${escSafe(typeof v==='object'?JSON.stringify(v):v)}</dd>`).join('');
    return `<div class="ag-record"><span class="ag-record-number">${String(i+1).padStart(2,'0')}</span><dl>${vals}</dl></div>`;
 }).join('');
 const label=ev.kind==='final'?'SYNTHESIS':ev.tool||'SOURCE READ';
 const head=`<header><small>STEP ${String(ev.ordinal).padStart(2,'0')} / ${escSafe(label)}</small><time>${escSafe(formatDate(ev.created_at))}</time></header>`;
 if(ev.kind==='final')return `<article class="ag-event ag-event-final">${head}<blockquote>${escSafe(p.answer||'No answer recorded')}</blockquote><p class="ag-evidence">References observed steps: ${escSafe((p.evidence_steps||[]).join(', ')||'none')} · Model-generated analysis</p></article>`;
 return `<article class="ag-event">${head}<div class="ag-evidence">D1 observation · ${Number(obs.row_count??rows.length)} rows sampled · ${escSafe(p.tool||ev.tool)}</div>${properties||'<p class="ag-muted">No matching records observed.</p>'}${p.truncated?'<p class="ag-caution">Sample limited to first 20 rows.</p>':''}</article>`;
}
export async function renderAgent({root,api,esc,success,error}){
 root.className=conf.cls+' agent-workspace';
 root.innerHTML=`<div class="ag-mast"><div><p class="ag-code">${esc(conf.eyebrow)}</p><h2>${esc(conf.title)}</h2><p>${esc(conf.tagline)}</p></div><div class="ag-volume">VOL. 01 <span>FIELD NOTES</span></div></div><div class="ag-archive"><div class="ag-research"><div class="ag-guideline"><span>QUESTION → SOURCES → ANALYSIS</span><strong id="ag-total">— CASES</strong></div><form id="ag-form" class="ag-composer"><label for="ag-objective">${esc(conf.prompt)}</label><textarea id="ag-objective" maxlength="600" required placeholder="${esc(conf.placeholder)}"></textarea><div class="ag-form-actions"><label for="ag-budget">Source steps <select id="ag-budget"><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></label><button type="submit">${esc(conf.button)}</button></div></form><div id="ag-inspect" class="ag-inspect"><p>Choose an archived case or open a new one. Evidence appears in a dated source folio.</p></div></div><aside class="ag-index"><h3>${esc(conf.status)}</h3><label>Search case files <input id="ag-filter" placeholder="Title or case…"/></label><div id="ag-sessions" class="ag-sessions">Loading casebook…</div><h3>${esc(conf.tools)}</h3><div id="ag-tool-list"></div><p class="ag-warning">AI-generated interpretations are not proof. Confirm every claim against its source record.</p></aside></div>`;
 const listRoot=root.querySelector('#ag-sessions');const inspect=root.querySelector('#ag-inspect');
 const filter=root.querySelector('#ag-filter');const counter=root.querySelector('#ag-total');
 const form=root.querySelector('#ag-form');
 const toolsEl=root.querySelector('#ag-tool-list');
 let records=[],selected=null;
 const notifyError=(err)=>{ if(typeof error==='function')error(err); };
 async function refresh(){
   try{
    const [data,settings,metrics]=await Promise.all([api('/api/agents'),api('/api/agents/config'),api('/api/agents/metrics')]);
    records=data.items||[];
    const count=Number(metrics.total??records.length);
    counter.textContent=`${count} CASES`;
    toolsEl.replaceChildren();
    (settings.tools||[]).forEach((name,i)=>{const item=document.createElement('div');item.className='ag-tool';item.textContent=`${String(i+1).padStart(2,'0')} / ${name.replaceAll('_',' ')}`;toolsEl.append(item)});
    paintList();
   }catch(e){notifyError(e);listRoot.textContent='Access required to view agent runs.';}
 }
 function paintList(){
   const q=filter.value.trim().toLowerCase();
   const subset=records.filter(s=>String(s.objective||'').toLowerCase().includes(q)||String(s.status||'').includes(q));
   listRoot.replaceChildren();
   subset.forEach((s,i)=>{
    const item=document.createElement('button');item.type='button';item.className='ag-run'+(s.id===selected?' is-selected':'');
    item.setAttribute('aria-pressed',String(s.id===selected));
    const title=document.createElement('strong');title.textContent=s.objective.slice(0,110);
    const meta=document.createElement('small');meta.textContent=`${String(i+1).padStart(2,'0')} · ${s.status} · ${s.step_count}/${s.max_steps}`;
    item.append(meta,title);item.addEventListener('click',()=>open(s.id));listRoot.append(item);
   });
   if(!subset.length){const p=document.createElement('p');p.textContent=filter.value?'No matching entries.':"Your casebook has no investigations yet";listRoot.append(p)}
 }
 async function open(id){
    selected=id;paintList();
    try{
      const {session:s,events=[]}=await api('/api/agents/'+encodeURIComponent(id));
      const safeObjective=escSafe(s.objective);
      const progress=`<progress max="${Math.max(1,Math.min(4,Number(s.max_steps)||3))}" value="${Math.max(0,Math.min(4,Number(s.step_count)||0))}"></progress>`;
      const eventMarkup=events.map(displayEvent).join('');
      inspect.innerHTML=`<div class="ag-report-header"><div><small>RUN ${escSafe(s.id.slice(0,8))} · ${escSafe(s.status)}</small><h3>${safeObjective}</h3></div><div class="ag-progress">${progress}<span>${Number(s.step_count)||0} / ${Number(s.max_steps)||3} decisions</span></div></div>${eventMarkup||'<div class="ag-empty">No observations yet. Operator advancement runs one AI decision.</div>'}${s.error?`<p class="ag-error" role="alert">${escSafe(s.error)}</p>`:''}<div class="ag-toolbar">${s.status==='ready'?'<button id="ag-advance" class="ag-primary">Run next reasoning step</button>':''}${['ready','needs_review','failed'].includes(s.status)?'<button id="ag-abandon" class="ag-secondary">Archive</button>':''}<button id="ag-export" class="ag-secondary">Export evidence trace</button>${s.status==='running'?'<span>Running; an interrupted run can be marked failed after five minutes.</span>':''}</div><p class="ag-warning">Every action is operator-initiated. Conclusions may be wrong; consult underlying records. No write tools or external actions.</p>`;

      inspect.insertAdjacentHTML('beforeend',`<section class="ag-review" aria-label="AI report review"><header><small>HUMAN ADJUDICATION</small><h3>${escSafe(conf.title)} / evidence review</h3></header><div id="ag-review-detail">Loading review…</div><p class="ag-review-disclaimer">Human acceptance records an assessment; it cannot authorize external agent actions.</p></section>`);
      const reviewRoot=inspect.querySelector('#ag-review-detail');
      try {
       const [review,identity]=await Promise.all([api('/api/agents/'+id+'/review'),api('/api/access/me')]);
       if(review.review){const r=review.review;reviewRoot.innerHTML=`<article class="ag-review-signed"><strong>${escSafe(r.verdict.replaceAll('_',' ').toUpperCase())}</strong><p>${escSafe(r.note)}</p><small>${escSafe(r.reviewed_by)} · ${escSafe(formatDate(r.created_at))}</small></article>`;}
       else if(['completed','needs_review','failed'].includes(s.status) && identity.role==='admin') {
         reviewRoot.innerHTML=`<form class="ag-review-form" id="ag-review-form"><label>Decision<select name="verdict" required><option value="requires_followup">Requires further investigation</option><option value="rejected">Reject unreliable findings</option>${s.status==='completed'?'<option value="accepted">Accept review findings</option>':''}</select></label><label>Evidence evaluation<textarea name="note" required minlength="12" maxlength="1500" placeholder="Review observations, model conclusion, source gaps and next steps…"></textarea></label><button type="submit" class="ag-primary">Sign immutable review</button></form>`;
         reviewRoot.querySelector('form').addEventListener('submit',async ev=>{ev.preventDefault();const form=ev.currentTarget;const button=form.querySelector('button');button.disabled=true;try{await api('/api/agents/'+id+'/review','POST',{verdict:form.elements.verdict.value,note:form.elements.note.value});await open(id);success?.('Immutable evidence review saved.')}catch(ex){button.disabled=false;notifyError(ex)}});
       }else reviewRoot.textContent= ['completed','needs_review','failed'].includes(s.status)?'Only the root administrator can sign the report.':'Finish or stop the agent run to enable human review.';
      }catch(ex){reviewRoot.textContent='Human review information could not be loaded.';notifyError(ex)}
      inspect.querySelector('#ag-advance')?.addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;button.textContent='Executing model decision…';try{await api('/api/agents/'+id+'/advance','POST',{});await refresh();await open(id);}catch(err){notifyError(err);await open(id);}});
      inspect.querySelector('#ag-abandon')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await api('/api/agents/'+id+'/abandon','POST',{});await refresh();await open(id);success?.('Session archived');}catch(err){notifyError(err);await open(id);}});
      inspect.querySelector('#ag-export')?.addEventListener('click',async()=>{
        try{const dossier=await api('/api/agents/'+id+'/dossier');const blob=new Blob([JSON.stringify(dossier,null,2)+'\n'],{type:'application/json'});const objectURL=URL.createObjectURL(blob);const link=document.createElement('a');link.href=objectURL;link.download=`agent-evidence-dossier-${s.id.slice(0,8)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);success?.('Dossier downloaded; handle source records as sensitive data.');}catch(ex){notifyError(ex)}
      });
    }catch(e){notifyError(e);inspect.textContent='Unable to load recorded analysis.';}
 }
 form.addEventListener('submit',async e=>{
   e.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;
   try{const result=await api('/api/agents','POST',{objective:form.querySelector('#ag-objective').value,max_steps:Number(form.querySelector('#ag-budget').value)});form.reset();await refresh();await open(result.id);success?.('Analysis created. Run steps explicitly to invoke Workers AI.');}
   catch(err){notifyError(err)}finally{button.disabled=false}
 });
 filter.addEventListener('input',paintList);
 await refresh();
}
