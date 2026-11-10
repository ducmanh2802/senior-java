# T555 — Dịch lại (nội dung đã sửa): q-system-design-2 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-2.en.js` đã cũ: **design-008, design-010, design-011, design-012, design-013**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-2 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ 5 entry design-008, design-010, design-011, design-012, design-013 theo bản tiếng Việt hiện tại; giữ nguyên design-009 và các mục khác.
- Sửa nội dung thiếu/không khớp: bổ sung câu về tăng W/R trong mục Quorum (design-011), sửa "sent/sent" thành "sending/sent" (design-008), sửa lỗi dấu full-width (。 ， ：) còn sót trong bản dịch cũ.
- Giữ nguyên code block, id, key; chuỗi/comment tiếng Việt trong code mẫu đã dịch sang tiếng Anh ("-- NULL for one-off jobs").
- `node scripts/check-i18n.js q-system-design-2` → OK; `node scripts/validate.js` → OK.
- Lưu ý: design-009 (không thuộc phạm vi task) vẫn còn một dấu "。" ở cuối Senior tip; chưa sửa vì task dặn không đụng mục khác.
