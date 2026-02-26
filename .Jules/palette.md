## 2024-05-23 - [Contrast-Aware Loading Spinners]
**Learning:** The application uses a yellow accent color (`#ffe600`) for primary buttons with dark text (`#2e2e38`). The existing `.ai-loading` class uses a white spinner which is invisible on this background.
**Action:** When adding loading states to accent buttons, override the spinner border color to `var(--primary)` (or a dark RGBA equivalent) to ensure visibility and maintain accessibility contrast ratios.
