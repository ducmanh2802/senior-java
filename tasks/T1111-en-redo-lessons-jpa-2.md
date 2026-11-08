# T1111 — Dịch lại (nội dung đã sửa): lessons-jpa-2 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jpa-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-jpa.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-jpa-2.en.js` đã cũ: **lesson-jpa-006, lesson-jpa-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-jpa.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-jpa-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-jpa-2 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-jpa-006` and `lesson-jpa-007` in `js/i18n/lessons-jpa-2.en.js` from the current VI source in `js/data/lessons-jpa.js` (lines 553+). Kept keys/field set identical to other entries (title, goals, body, exercises, check); no other IDs touched.
- Markup rules followed (no backticks, no `${}`; `{{}}`/`~~~` preserved). `node --check`, `node scripts/check-i18n.js lessons-jpa-2` → OK, `node scripts/validate.js` → OK (only pre-existing warnings: q-java.js modern-033 length, path.js missing lesson-design-006/007). No git commit, no browser, no process kills.
Reviewed-by: check-i18n (translation, no LLM review)
