## 2024-05-23 - Firebase Modal State Persistence
**Learning:** In this static HTML/Firebase architecture, modals are often just hidden (display: none) rather than destroyed. UI state changes (like disabling buttons or changing text to 'Saving...') persist across re-opens if not explicitly reset.
**Action:** Always use try/finally blocks to reset UI elements (buttons, forms) to their initial interactive state after async operations complete, ensuring the modal is fresh for the next use.
