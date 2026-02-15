/**
 * Escapes HTML characters in a string to prevent XSS.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped HTML string.
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
