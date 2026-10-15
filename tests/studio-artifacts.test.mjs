import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceDossierFor} from '../public/studio.js';
import {downloadArtifact} from '../public/studio-export.js';
test('studio supports explicit domain-specific artifact export',()=>{assert.equal(typeof evidenceDossierFor,'function');assert.equal(typeof downloadArtifact,'function');});
test('domain report derives truthful, bounded artifacts from selected records',()=>{  const file=evidenceDossierFor({id:'a',title:'Contract'},[{other:'b',count:2,terms:['company: a']}],{id:'a',content:'signed'});assert.equal(file.shared_entities[0].count,2);assert.equal(file.document.content,'signed');assert.ok(file.caveats.length>=2); });
