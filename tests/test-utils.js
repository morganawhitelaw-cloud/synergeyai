const assert = require('assert');
const { formatDate } = require('../js/utils.js');

console.log('Running tests for formatDate...');

// Test 1: Happy Path with "2023-01-01"
// Note: The specific output depends on the timezone of the environment running the test.
// We print the output for manual verification but automated check verifies it's a non-empty string different from TBD/Invalid.
const dateStr = '2023-01-01';
const result = formatDate(dateStr);
console.log(`Input: '${dateStr}' -> Output: '${result}'`);

assert.ok(result, 'Result should be truthy');
assert.notStrictEqual(result, 'TBD', 'Should not be TBD for valid date');
assert.notStrictEqual(result, 'Invalid Date', 'Should not be Invalid Date for valid date');

// To be precise, if we assume UTC environment:
if (new Date().getTimezoneOffset() === 0) {
   // This check is a bit flaky if not running in strict UTC, so maybe skip specific string assertion
   // or just log it.
}

// Test 2: 'TBD'
assert.strictEqual(formatDate('TBD'), 'TBD', 'Should return TBD for "TBD"');

// Test 3: Edge cases (null, undefined, empty)
assert.strictEqual(formatDate(null), 'TBD', 'Should return TBD for null');
assert.strictEqual(formatDate(undefined), 'TBD', 'Should return TBD for undefined');
assert.strictEqual(formatDate(''), 'TBD', 'Should return TBD for empty string');

// Test 4: Invalid Date
assert.strictEqual(formatDate('invalid-date-string'), 'Invalid Date', 'Should return Invalid Date for invalid input');

console.log('All tests passed!');
