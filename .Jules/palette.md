## 2024-05-22 - Replacing Alerts with Toasts
**Learning:** This app heavily relies on blocking `alert()` dialogs for feedback in some files (`index.html`) while using non-blocking Toasts in others (`transcript-analyzer.html`). This inconsistency creates a jarring experience.
**Action:** When implementing feedback, always check for existing non-blocking patterns (like the `.notification` toast) and prioritize porting them over creating new ones or using native alerts.
