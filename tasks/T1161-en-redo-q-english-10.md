# T1161 — Dịch lại (nội dung đã sửa): q-english-10 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-10.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-10.en.js` đã cũ: **english-094, english-095, english-096, english-097, english-098, english-099, english-100, english-101, english-102**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-10.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-10 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 9 entry (english-094 → english-102) trong `js/i18n/q-english-10.en.js`, giữ nguyên key, field set, code block `~~~seq`, id, url và tags.
- Chữ tiếng Việt trong code/comment đã dịch sang tiếng Anh; không backtick, không `${`.
- Kiểm tra: `node --check` → SYNTAX OK; `node scripts/check-i18n.js q-english-10` → OK (9 mục); `node scripts/validate.js` → OK (không lỗi liên quan english-094..102).
- Không thay đổi file khác, không commit.
