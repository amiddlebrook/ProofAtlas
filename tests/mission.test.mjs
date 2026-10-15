import test from 'node:test';import assert from 'node:assert/strict';import {documentClaims,excerpt} from '../public/mission.js';
test('reading-room claims are scoped to the selected document',()=>{assert.deepEqual(documentClaims('a',[{document_id:'a',id:1},{document_id:'b',id:2}]).map(x=>x.id),[1])});
test('reading-room excerpt focuses the selected phrase',()=>{assert.ok(excerpt('one two three','two').includes('two'));assert.equal(excerpt('short','missing'),'short')});
