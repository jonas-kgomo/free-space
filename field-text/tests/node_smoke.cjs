const DF = require('../dist/index.js');
const assert = require('assert');

console.log("Testing Distance Field CJS bundle in Node...");

try {
    // 1. Check exports
    assert.strictEqual(typeof DF.prepare, 'function', "prepare should be exported");
    assert.strictEqual(typeof DF.layout, 'function', "layout should be exported");
    assert.strictEqual(typeof DF.flowText, 'function', "flowText should be exported");
    
    console.log("✅ CJS Exports Verified");

    // Note: prepare() will fail here because 'document' is not defined in Node.
    // That's expected for a browser-centric library unless shimmed.
    
    try {
        DF.prepare("test", "16px sans-serif");
    } catch (e) {
        if (e.message.includes("document is not defined") || e.message.includes("ReferenceError")) {
            console.log("ℹ️ prepare() correctly failed in Node as expected (no JSDOM/Canvas)");
        } else {
            throw e;
        }
    }

} catch (err) {
    console.error("❌ CJS Test Failed:", err.message);
    process.exit(1);
}
