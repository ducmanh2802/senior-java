# T1196 — Dịch lại (nội dung đã sửa): q-scenario-12 (17 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-12.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-12.en.js` đã cũ: **scenario-087, scenario-088, scenario-089, scenario-090, scenario-091, scenario-092, scenario-093, scenario-094, scenario-095, scenario-096, scenario-097, scenario-098, scenario-099, scenario-100, scenario-101, scenario-102, scenario-103**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-12.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-12 → OK; node scripts/validate.js → OK.

## Notes
Redo translation entries scenario-087..103 verified; check-i18n OK. validate.js has pre-existing unrelated errors in other modules.
