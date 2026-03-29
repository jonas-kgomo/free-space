import * as DF from '../dist/index.mjs';
import assert from 'node:assert';

console.log("Testing Distance Field ESM bundle in Node...");

try {
    // 1. Check exports
    assert.strictEqual(typeof DF.prepare, 'function', "prepare should be exported");
    assert.strictEqual(typeof DF.layout, 'function', "layout should be exported");
    assert.strictEqual(typeof DF.flowText, 'function', "flowText should be exported");
    
    console.log("✅ ESM Exports Verified");

} catch (err) {
    console.error("❌ ESM Test Failed:", err.message);
    process.exit(1);
}
