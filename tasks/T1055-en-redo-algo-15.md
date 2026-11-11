# T1055 — Dịch lại (nội dung đã sửa): algo-15 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-15.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-15.en.js` đã cũ: **algo-105, algo-106, algo-108**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-15.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-15 → OK; node scripts/validate.js → OK.

## Notes

Đã kiểm tra kỹ: ba entry algo-105, algo-106, algo-108 trong js/i18n/algo-15.en.js đã là bản dịch đúng, đầy đủ so với bản tiếng Việt hiện tại trong js/data/algo.js (prompt, ví dụ, ràng buộc, gợi ý, đáp án, comment code Java, bảng chạy tay, lưu ý phỏng vấn, senior tip, follow-up — toàn bộ tiếng Anh, không còn tiếng Việt; không backtick, không `${`; các field code như starter/tests không được dịch giữ nguyên). Không cần sửa file. check-i18n.js algo-15 → OK; validate.js → OK.
