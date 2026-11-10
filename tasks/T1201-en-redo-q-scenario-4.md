# T1201 — Dịch lại (nội dung đã sửa): q-scenario-4 (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-4.en.js` đã cũ: **scenario-046, scenario-048, scenario-049, scenario-050, scenario-051, scenario-052, scenario-053, scenario-054, scenario-055, scenario-056**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-4 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 10 mục scenario theo yêu cầu, validator OK.
Reviewed-by: check-i18n (translation, no LLM review)
