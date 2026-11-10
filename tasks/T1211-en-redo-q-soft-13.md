# T1211 — Dịch lại (nội dung đã sửa): q-soft-13 (1 mục)

Status: DONE
Notes: Re-translated testing-041; check-i18n OK. Validate has pre-existing unrelated errors (api-* topics).
Agent: opencode
Owns: `js/i18n/q-soft-13.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-13.en.js` đã cũ: **testing-041**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-13.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-13 → OK; node scripts/validate.js → OK.

## Notes
