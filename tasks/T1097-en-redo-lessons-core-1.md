# T1097 — Dịch lại (nội dung đã sửa): lessons-core-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-core-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-core.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-core-1.en.js` đã cũ: **lesson-core-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-core.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-core-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-core-1 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-core-005` in `js/i18n/lessons-core-1.en.js` to match current `js/data/lessons-core.js` (kept key; only translatable fields: title, goals, body, exercises prompt/hints/explain, check). Did not copy `starter/tests/reference` per i18n checker rule.
- Expanded explanation for ~4-year Java devs new to concepts (immutability, pool, identity vs content, O(n²) concat, GC, normalization/masking, leading zeros, char[] for secrets). Preserved markup rules ({{code}}, `~~~`, no backticks/`${`). `node --check` OK.
- Verified: `node scripts/check-i18n.js lessons-core-1` → OK (5 mục đã dịch); `node scripts/validate.js` → OK (warnings unrelated). No git commit/push.
Reviewed-by: check-i18n (translation, no LLM review)
