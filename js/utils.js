function formatDate(dateStr) {
    if (!dateStr || dateStr === 'TBD') return 'TBD';
    return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatDate };
}
