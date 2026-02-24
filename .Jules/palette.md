## 2024-05-23 - Accessibility & Loading States
**Learning:** The app uses icon-only buttons (e.g., in tables and modals) which lack `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Always check for icon-only buttons and add descriptive `aria-label` attributes.

**Learning:** Primary action buttons (yellow background) require a dark loading spinner for contrast, whereas the default `.ai-loading` is white.
**Action:** Use inline styles (or a utility class if available) to override `border-color` and `border-top-color` on the `.ai-loading` span when used on light-colored buttons.
