# T1199 — Dịch lại (nội dung đã sửa): q-scenario-2 (11 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-2.en.js` đã cũ: **scenario-015, scenario-016, scenario-017, scenario-018, scenario-019, scenario-020, scenario-021, scenario-022, scenario-023, scenario-024, scenario-026**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-2 → OK; node scripts/validate.js → OK.

## Notes
Existing English translations pass check-i18n and validate. Kept as-is.
