## 2026-02-18 - Reusable Toast Component
**Learning:** Found a reusable Toast notification pattern in `transcript-analyzer.html` that wasn't used in `index.html`.
**Action:** Ported the CSS and JS logic to `index.html` to replace intrusive `alert()` calls. Future enhancements should extract this into a shared `js/utils.js` and `css/styles.css` to avoid duplication.
