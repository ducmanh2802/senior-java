# T1194 — Dịch lại (nội dung đã sửa): q-scenario-1 (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-1.en.js` đã cũ: **scenario-001, scenario-003, scenario-004, scenario-005, scenario-006, scenario-007, scenario-008, scenario-009, scenario-010, scenario-011, scenario-012, scenario-013, scenario-014**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-1 → OK; node scripts/validate.js → OK.

## Notes

## Notes
- check-i18n OK; validate has pre-existing errors unrelated to owned file.
