## 2026-02-20 - Button Loading States & Form Accessibility
**Learning:** The application's primary action buttons use a light accent color (yellow), making the existing `.ai-loading` spinner (white) invisible. A dark spinner variant (`.btn-loading-spinner`) is required for these buttons.
**Action:** Use `.btn-loading-spinner` for any future loading states on primary/accent buttons.

**Learning:** Form labels in modals (e.g., "User Story *") consistently lack `for` attributes connecting them to their inputs, which fails WCAG 2.1 Success Criterion 1.3.1.
**Action:** Future accessibility passes should prioritize associating labels with inputs using `for`/`id` pairs.
