## 2024-05-22 - Initial Assessment
**Learning:** Found significant usage of Firebase operations directly in `index.html`. These async operations lack visual feedback (loading spinners) on the primary action buttons, leading to potential user frustration or duplicate submissions.
**Action:** Implement loading states on primary action buttons that respect the button's text color contrast (e.g., dark spinner on light/yellow buttons).

## 2024-05-22 - Accessibility Findings
**Learning:** Icon-only buttons (like modal close buttons and table action buttons) lack `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Add `aria-label` to all icon-only interactive elements in future updates.
