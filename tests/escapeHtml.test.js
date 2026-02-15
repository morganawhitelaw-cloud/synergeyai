const { escapeHtml } = require('../js/utils.js');

describe('escapeHtml', () => {
    test('should handle null or undefined input', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    test('should handle empty string input', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('should return safe string as is', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
        expect(escapeHtml('1234567890')).toBe('1234567890');
    });

    test('should escape HTML special characters for content context', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
        expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
        expect(escapeHtml('&')).toBe('&amp;');
    });

    test('should escape quotes for attribute context', () => {
        expect(escapeHtml('"')).toBe('&quot;');
        expect(escapeHtml("'")).toBe('&#39;');
        expect(escapeHtml(`'"`)).toBe('&#39;&quot;');
    });
});
