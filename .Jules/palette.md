## 2024-05-22 - Missing Form Labels
**Learning:** The project uses `<div class="form-group"><label>Text</label><input id="..."></div>` pattern extensively, but misses the `for` attribute connecting the label to the input. This breaks accessibility for screen readers.
**Action:** When adding new forms or reviewing existing ones, always ensure `<label>` tags include a `for` attribute matching the input's `id`.
