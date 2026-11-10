# T486 — Dịch lại (nội dung đã sửa): algo-11 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-11.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-11.en.js` đã cũ: **algo-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-11.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-11 → OK; node scripts/validate.js → OK.

## Notes

- Rà lại `algo-001` trong `js/i18n/algo-11.en.js` với bản tiếng Việt hiện tại của `js/data/algo.js` (đã được viết lại ở commit c7cd435): prompt, 3 hints, solution (kể cả chú thích trong code Java), mục "Why are duplicate values still handled correctly?", 3 ghi chú phỏng vấn, Senior tip và follow đều khớp nội dung mới — không còn đoạn nào của bản dịch cũ. Entry đã đầy đủ field (prompt/hints/solution/follow) và không có backtick hay `${`.
- Các entry algo-002..007 trong cùng file được đối chiếu nhanh với bản tiếng Việt và giữ nguyên (không sửa), đúng phạm vi task.
- Đã chạy `node scripts/check-i18n.js algo-11` → OK — 7 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
