## 2024-05-22 - Reusing Spinners in Legacy CSS
**Learning:** When working in a legacy/static site without a build system or shared CSS, reusing existing utility classes (like `.ai-loading`) and adapting them with inline styles (e.g., `border-color`) is a clean way to add loading states without introducing new global CSS or conflicts.
**Action:** Look for existing animation classes before creating new ones; modify colors via inline styles or `currentColor` if possible.
