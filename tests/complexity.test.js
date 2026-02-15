const assert = require('node:assert');
const { test, describe } = require('node:test');
const { estimateComplexity } = require('../js/complexity-estimator.js');

describe('Complexity Estimator', () => {

    test('High Complexity', () => {
        assert.strictEqual(estimateComplexity('We need to integrate with SAP'), 'high');
        assert.strictEqual(estimateComplexity('Build a new microservice'), 'high');
        assert.strictEqual(estimateComplexity('Architect the solution'), 'high');
    });

    test('Medium Complexity', () => {
        assert.strictEqual(estimateComplexity('Analyze the requirements'), 'medium');
        assert.strictEqual(estimateComplexity('Validate the data'), 'medium');
        assert.strictEqual(estimateComplexity('Configure the server'), 'medium');
    });

    test('Low Complexity', () => {
        assert.strictEqual(estimateComplexity('Document the process'), 'low');
        assert.strictEqual(estimateComplexity('Collect feedback'), 'low');
        assert.strictEqual(estimateComplexity('List all items'), 'low');
    });

    test('Mixed Complexity (Priority)', () => {
        // High + Medium -> High
        assert.strictEqual(estimateComplexity('Integrate and analyze'), 'high');
        // High + Low -> High
        assert.strictEqual(estimateComplexity('Build and document'), 'high');
        // Medium + Low -> Medium
        assert.strictEqual(estimateComplexity('Analyze and list'), 'medium');
    });

    test('Case Insensitivity', () => {
        assert.strictEqual(estimateComplexity('INTEGRATE'), 'high');
        assert.strictEqual(estimateComplexity('analyze'), 'medium');
        assert.strictEqual(estimateComplexity('Document'), 'low');
    });

    test('Edge Cases', () => {
        assert.strictEqual(estimateComplexity(''), 'low');
        assert.strictEqual(estimateComplexity('   '), 'low');
        assert.strictEqual(estimateComplexity('no matching keywords here'), 'low');
    });
});
