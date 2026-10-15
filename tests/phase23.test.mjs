import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
function luminance(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('palette supplies distinct semantic hues and legible reading surfaces',()=>{
 const html=readFileSync('public/index.html','utf8');assert.match(html,/href="\/palette-balance\.css"/);
 const css=readFileSync('public/palette-balance.css','utf8');
 const tokens={};for(const [,key,value] of css.matchAll(/--(bg|surface|text|muted|accent|info|success|warning):(#(?:[0-9a-fA-F]{6}))/g))tokens[key]=value;
 for(const name of ['bg','surface','text','muted','accent','info','success','warning'])assert.ok(tokens[name],`Missing ${name} color token`);
 assert.ok(contrast(tokens.text,tokens.bg)>=7,'Primary text must pass AAA contrast on app background');
 assert.ok(contrast(tokens.text,tokens.surface)>=7,'Primary text must pass AAA contrast on cards');
 assert.ok(contrast(tokens.muted,tokens.surface)>=4.5,'Supporting text must pass AA contrast');
 assert.equal(new Set([tokens.accent,tokens.info,tokens.success,tokens.warning]).size,4,'Semantic colors must be distinct');
 assert.match(css,/:focus-visible/,'Visible keyboard focus required');
});
import {ledgerSummary,ledgerCsv} from '../public/domain-lab.js';
test('custody ledger counts integrity fault categories and safely exports spreadsheet data',()=>{
 const rows=[{claim_id:'c1',document_id:'d',title:'Good',verified:true,findings:[],assertion:'Recorded'},{claim_id:'c2',document_id:'d',title:'Bad',verified:false,findings:['quote_missing','digest_changed'],assertion:'=HYPERLINK("evil")'}];
 const result=ledgerSummary(rows);assert.equal(result.verified,1);assert.equal(result.at_risk,1);assert.equal(result.quote_missing,1);assert.equal(result.digest_changed,1);
 const csv=ledgerCsv(rows);assert.match(csv,/"'=HYPERLINK\(""evil""\)"/);assert.match(csv,/quote_missing; digest_changed/);assert.equal(csv.trim().split('\r\n').length,3);
});
