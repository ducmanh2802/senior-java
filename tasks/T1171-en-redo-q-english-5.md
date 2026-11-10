# T1171 — Dịch lại (nội dung đã sửa): q-english-5 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-5.en.js` đã cũ: **english-058, english-059, english-060, english-061, english-062, english-063**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-5 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `english-058..063` in `js/i18n/q-english-5.en.js` from current Vietnamese source (q-english.js lines ~2404–2705), preserving keys/fields (`q`, `a`, `follow`) and structure parity with i18n overlay.
- No backticks or `${` introduced; code/ids/URLs unchanged (no code samples in these entries).
- `node scripts/check-i18n.js q-english-5` → `OK — 6 mục đã dịch.`
- `node scripts/validate.js` reports 31 pre-existing ERRORS in files I do not own (`lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js` referencing missing `api-*` IDs) plus 2 pre-existing warnings (`q-java.js modern-033` short answer, `path.js` lessons not in PATH). No changes made outside owned file; flagging for integrator.
Reviewed-by: check-i18n (translation, no LLM review)
