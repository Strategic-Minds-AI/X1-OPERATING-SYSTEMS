import test from 'node:test';
import assert from 'node:assert/strict';
import { renderText, renderFileTree, validateTemplatePack, generateTokens, validateContrast, validateLaunchBlueprint } from '../src/launchStudioEngine.js';

test('template renderer interpolates variables and redacts secret-named fields', () => {
  const result = renderText('Hello {{brand}} · {{api_key}}', {brand:'Northstar',api_key:'do-not-expose'});
  assert.equal(result,'Hello Northstar · [REDACTED]');
});

test('template renderer supports conditions and bounded list rendering', () => {
  const result = renderText('{{#if enabled}}Active{{/if}}:{{#each services}}{{this.name}};{{/each}}',{enabled:true,services:[{name:'Roofing'},{name:'HVAC'}]});
  assert.equal(result,'Active:Roofing;HVAC;');
});

test('file-tree renderer validates shape and infers file media types', () => {
  const pack={id:'site',version:'1.0.0',mode:'website',files:[{path:'index.html',content:'<h1>{{brand}}</h1>'}]};
  assert.deepEqual(validateTemplatePack(pack),{valid:true,errors:[]});
  assert.deepEqual(renderFileTree(pack,{brand:'Northstar'}),[{path:'index.html',content:'<h1>Northstar</h1>',media_type:'text/html'}]);
});

test('color intelligence produces four semantic modes and contrast diagnostics', () => {
  const tokens=generateTokens('#176BFF');
  assert.ok(tokens.semantic.light.canvas);
  assert.ok(tokens.semantic.dark.canvas);
  assert.ok(tokens.semantic['high-contrast-light']['text-primary']);
  assert.ok(tokens.semantic['high-contrast-dark']['text-primary']);
  assert.equal(tokens.meta.source,'#176bff');
  assert.ok(Array.isArray(validateContrast(tokens)));
});

test('blueprint quality gate blocks missing required page and hero content', () => {
  const result=validateLaunchBlueprint({businessName:'',pages:[],sections:[]},{headline:'',primaryCta:'',serviceCards:[]},generateTokens('#176BFF'));
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.errors.length>=3);
});
