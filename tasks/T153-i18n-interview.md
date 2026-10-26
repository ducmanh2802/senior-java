# T153 — Song ngữ EN/VI cho giao diện: interview, mock, career

Status: DONE
Agent: opencode
Owns: `js/views/interview.js`, `js/views/mock.js`, `js/views/career.js`

## Notes

- Hoàn thành i18n UI cho 3 view. Số key mỗi ngôn ngữ (vi/en đối xứng đầy đủ, đã kiểm tra parity):
  - `interview.js`: 94 key (`interview.*`) — thêm ~31 key mới (intent, hire_signal, JD table cols, persona/minutes chips, resumeMeta, transcript header, betterAnswer, thinking…); thay `INTENT`/`SIGNAL` hằng số hard-code bằng key `App.t`; bỏ `LEVELS` local dùng `App.LEVELS`; locale `toLocaleString` theo `App.lang`.
  - `mock.js`: 62 key — dict đã có sẵn gần như đầy đủ; thêm 1 key `mock.presetScenario` và dùng `App.t` cho preset "Tình huống thực tế"; `aiSuggest` dùng vars API.
  - `career.js`: file trước đó bị cắt cụt (59 dòng, mất toàn bộ body) — đã khôi phục body từ git HEAD + i18n hóa toàn bộ: 103 key (pageTitle×3, tabs, form, log, CV result table cols, themes via `THEME_KEYS` map, `resultLabel`, speech practice, export…). THEMES giữ giá trị VI làm data (khớp story đã lưu), hiển thị qua key.
- Chuỗi gửi AI (prompt/config/seeds), nội dung dữ liệu, tên ngôn ngữ self-referential (Tiếng Việt/English), regex `**Tóm tắt:**` giữ nguyên.
- `node --check` 3 file OK; `node scripts/validate.js` → `OK — không có lỗi.` (warning path.js là của task khác).
