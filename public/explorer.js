// ProofAtlas: domain-specific record exploration over the authenticated page of records.
export const presets=[{"id": "all", "label": "All sources"}, {"id": "classified", "label": "Classified sources"}, {"id": "unclassified", "label": "Unclassified sources"}, {"id": "quoted", "label": "Quotation records"}];
export function filtersMarkup(total){
 return `<section class="enterprise-explorer pa-explorer" aria-label="Source index"><div class="enterprise-explorer-copy"><span class="enterprise-explorer-overline">COLLECTION / FINDING AID</span><strong class="enterprise-explorer-label">Source index</strong><small id="enterprise-record-count" aria-live="polite">${total} loaded records</small></div><div class="enterprise-explorer-controls"><label>Search records<input id="filter" class="search" type="search" placeholder="Search indexed titles, quotes, sources…" autocomplete="off" /></label><label>View<select id="enterprise-preset">${presets.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select></label><label>Order<select id="enterprise-order"><option value="newest">Most recent</option><option value="oldest">Oldest first</option><option value="az">Title A → Z</option></select></label><button id="enterprise-export" type="button" class="btn secondary">Export visible JSON</button></div></section>`;
}
export function refineRecords(rows,{query='',preset='all',order='newest'}={}){
 const q=String(query).trim().toLocaleLowerCase();
 const matched=rows.filter(r=>{if(q&&!JSON.stringify(r).toLocaleLowerCase().includes(q))return false;
 const c=String(r.classification||r.source_classification||'').toLowerCase();return preset==='classified'?/confidential|secret|restricted|internal/.test(c):preset==='unclassified'?c===''||/public|unclassified|open/.test(c):preset==='quoted'?Boolean(r.quote||r.assertion):true;
 });
 const title=r=>String(r.name||r.title||r.workflow||r.model||r.experiment||r.id||'');
 const date=r=>Date.parse(r.created_at||r.updated_at||'')||0;
 return matched.sort((a,b)=>order==='az'?title(a).localeCompare(title(b)):order==='oldest'?date(a)-date(b):date(b)-date(a));
}
