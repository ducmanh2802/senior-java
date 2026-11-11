# T1098 — Dịch lại (nội dung đã sửa): lessons-core-2 (1 mục)

Status: DONE

## Notes
- File `js/i18n/lessons-core-2.en.js` (id `lesson-core-006`) was already complete and correct from the previous interrupted run. Re-verified by parsing both files, comparing section headings (all 10 body sections + interview notes + 4 check items + exercise prompt/hints/explain present), spot-checking key terms (equals/hashCode/compareTo/TreeSet/HashSet/HashMap/Record/Math.addExact/Long.compare/Objects.hash/instanceof/retryOn/getSuppressed/Predicate/maxAttempts), confirming structural parity (1 code block, 1 table, 1 tip quote in body), and checking for stray Vietnamese characters (none).
- `node scripts/check-i18n.js lessons-core-2` → `OK — 1 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (warnings are pre-existing and unrelated: modern-033 short answer, path.js orphan lessons).
- `node --check js/i18n/lessons-core-2.en.js` → syntax OK.
- No code fields (starter/tests/reference) are copied into the .en.js file — they stay in the Vietnamese source and are not translated, per check-i18n rules.
Agent: opencode
Owns: `js/i18n/lessons-core-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-core.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-core-2.en.js` đã cũ: **lesson-core-006**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-core.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-core-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-core-2 → OK; node scripts/validate.js → OK.

## Notes
