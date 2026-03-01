## 2026-03-01 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like 'x' for close or generic icons for edit/delete) require explicit text alternatives (like `aria-label`) for screen reader users to understand their purpose, as visual cues alone are insufficient.
**Action:** Always add descriptive `aria-label` attributes to buttons that contain only icons or symbolic characters (e.g., `&times;`, `✎`, `✓`, `✕`).
