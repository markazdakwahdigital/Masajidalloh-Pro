import test from 'node:test';
import assert from 'node:assert/strict';
import {formatRupiahTyping,rupiahCanonical,rupiahDisplay} from '../src/lib/rupiah-input.ts';
test('rupiah grouping never changes stored value and supports cents, paste and empty',()=>{
 for(const [input,display,canonical] of [['1000','1.000','1000'],['10000','10.000','10000'],['1000000','1.000.000','1000000'],['Rp 1.234.567,89','1.234.567,89','1234567.89'],['0001200','1.200','1200'],['0,50','0,50','0.50'],['','','']]){assert.equal(formatRupiahTyping(input),display);assert.equal(rupiahCanonical(display),canonical);}
 assert.equal(rupiahDisplay('1000000.50'),'1.000.000,50');assert.equal(rupiahCanonical(',5'),'0.5');
});
