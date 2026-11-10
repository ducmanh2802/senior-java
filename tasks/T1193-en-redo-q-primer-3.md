# T1193 — Dịch lại (nội dung đã sửa): q-primer-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-primer-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-primer.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-primer-3.en.js` đã cũ: **primer-017**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-primer.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-primer-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-primer-3 → OK; node scripts/validate.js → OK.

## Notes
- primer-017 entry in js/i18n/q-primer-3.en.js already matches current Vietnamese source; check-i18n OK.
