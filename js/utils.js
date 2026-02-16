/**
 * Utility functions for the application
 */

function getStatusClass(status) {
    if (status === 'Completed') return 'status-completed';
    if (status === 'In Progress') return 'status-in-progress';
    if (status === 'Yet to start') return 'status-yet-to-start';
    return 'status-not-set';
}

function escapeHtml(text) {
    if (!text) return '';
    // Check if document is available (browser/jsdom)
    if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    // Fallback for non-browser environments
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncate(text, length) {
    if (!text) return 'N/A';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function extractSearchTerms(story) {
    // Extract meaningful keywords from the story
    const text = `${story.User_Story || ''} ${story.Feature || ''} ${story.Epic || ''} ${story.Acceptance_Criteria || ''}`.toLowerCase();

    // Remove common words and extract technical terms
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
                        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                        'as', 'i', 'want', 'to', 'so', 'that', 'can', 'and', 'or', 'but', 'if', 'then', 'else',
                        'when', 'where', 'who', 'what', 'which', 'this', 'that', 'these', 'those', 'for', 'with',
                        'user', 'able', 'system', 'need', 'needs', 'feature'];

    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const filtered = words.filter(w => !stopWords.includes(w));

    // Get unique terms, prioritizing longer/more specific ones
    const unique = [...new Set(filtered)].sort((a, b) => b.length - a.length);
    return unique.slice(0, 8);
}

// Export for CommonJS if module is defined
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getStatusClass,
        escapeHtml,
        truncate,
        debounce,
        extractSearchTerms
    };
}
