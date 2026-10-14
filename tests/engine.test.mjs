import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const moduleUnderTest=require(resolve('tests/.compiled/index.js'));
test('ProofAtlas: chunks respect size budget and preserve content',()=>{
  const text='hello world '.repeat(130).trim();const chunks=moduleUnderTest.makeChunks(text,48);
  assert.ok(chunks.length>3);assert.ok(chunks.every(c=>c.length<=48));assert.equal(chunks.join(' '),text);
});
test('ProofAtlas: entity extraction deduplicates',()=>{
  const entities=moduleUnderTest.extractEntities('Contract CTR-1234 due 2027-01-05. CTR-1234 costs $100. Notify x@example.com x@example.com.');
  assert.equal(entities.filter(e=>e.kind==='contract').length,1);
  assert.equal(entities.filter(e=>e.kind==='email').length,1);
  assert.ok(entities.some(e=>e.kind==='date'));
});