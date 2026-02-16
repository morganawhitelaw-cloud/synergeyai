const assert = require('node:assert');
const { test } = require('node:test');

const { escapeHtml } = require('../js/utils.js');

test('escapeHtml should escape special characters', (t) => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
    assert.strictEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
    assert.strictEqual(escapeHtml("Start & End"), 'Start &amp; End');
    assert.strictEqual(escapeHtml("'quoted'"), '&#039;quoted&#039;');
});

test('escapeHtml should handle null/undefined/empty string/zero', (t) => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(undefined), '');
    assert.strictEqual(escapeHtml(''), '');
    assert.strictEqual(escapeHtml(0), ''); // 0 is falsy, so returns empty string as per existing logic
});

test('escapeHtml should handle normal text', (t) => {
    assert.strictEqual(escapeHtml('Hello World'), 'Hello World');
});
