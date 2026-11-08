# T1085 — Dịch lại (nội dung đã sửa): lessons-aws-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-aws-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-aws-3.en.js` đã cũ: **lesson-aws-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-aws-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-aws-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-aws-004` in `js/i18n/lessons-aws-3.en.js` from current Vietnamese source (`js/data/lessons-aws.js` lines ~883–1108): updated title/goals/body/check to match current content; translated exercise translatable fields (title/prompt/hints/explain). Kept key `lesson-aws-004`; did not copy code/artifact fields (starter/tests/reference) to satisfy `check-i18n` ("chỉ chép field dịch"); left `lesson-aws-003` unchanged.
- Fixed a transient syntax duplication introduced during edit (removed duplicated old tail) and re-verified with `node --check`.
- Acceptance: `node scripts/check-i18n.js lessons-aws-3` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (existing warnings only: modern-033 short answer; 2 PATH lessons not in PATH).
- Only owned file changed; no git commit; no browser/npm install; no process kills.
Reviewed-by: check-i18n (translation, no LLM review)
