
// Complexity keywords
const COMPLEXITY_KEYWORDS = {
    high: ['integrate', 'build', 'develop', 'architect', 'design', 'implement',
           'complex', 'multiple', 'automate', 'optimize', 'transform', 'migrate', 'create', 'establish'],
    medium: ['analyze', 'validate', 'configure', 'review', 'test', 'evaluate',
             'assess', 'compare', 'reconcile', 'adjust', 'modify', 'compile', 'generate'],
    low: ['collect', 'gather', 'document', 'list', 'identify', 'copy',
          'export', 'send', 'receive', 'format', 'update', 'check', 'finalize']
};

// Estimate complexity based on description
function estimateComplexity(description) {
    const text = description.toLowerCase();

    let highCount = COMPLEXITY_KEYWORDS.high.filter(kw => text.includes(kw)).length;
    let mediumCount = COMPLEXITY_KEYWORDS.medium.filter(kw => text.includes(kw)).length;
    let lowCount = COMPLEXITY_KEYWORDS.low.filter(kw => text.includes(kw)).length;

    if (highCount > 0) return 'high';
    if (mediumCount > 0) return 'medium';
    return 'low';
}

// Module exports for Node.js / Window attachment for Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { estimateComplexity, COMPLEXITY_KEYWORDS };
} else {
    window.estimateComplexity = estimateComplexity;
    window.COMPLEXITY_KEYWORDS = COMPLEXITY_KEYWORDS;
}
