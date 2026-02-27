## 2024-05-22 - Async Button Loading States
**Learning:** In this vanilla JS setup, reusing the `.ai-loading` class for button spinners requires inline style overrides (`border-top-color: var(--primary)`) when used on yellow primary buttons to ensure contrast.
**Action:** When adding loading states to other primary buttons, replicate this pattern: disable button, inject spinner with inline contrast fix, and use `finally` to restore state.
