## 2026-02-17 - [Accessibility] Toast Notifications
**Learning:** When replacing native `alert()` with custom toast notifications, we must ensure screen reader compatibility. Native `alert()` is announced automatically. Custom implementations require `role="alert"` or `aria-live="assertive"` to maintain this accessibility standard.
**Action:** Always include ARIA live region attributes on notification containers.
