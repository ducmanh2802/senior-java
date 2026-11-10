# T1058 — Dịch lại (nội dung đã sửa): algo-18 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-18.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-18.en.js` đã cũ: **algo-132, algo-134, algo-135, algo-136, algo-137**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-18.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-18 → OK; node scripts/validate.js → OK.

Kết quả: 5 mục (algo-132, 134, 135, 136, 137) đã được so sánh với bản tiếng Việt hiện tại trong `js/data/algo.js`. Bản tiếng Anh trong `js/i18n/algo-18.en.js` đã chính xác, khớp nội dung tiếng Việt (prompt, hints, solution, follow, code comments) — không cần sửa thêm. `node scripts/check-i18n.js algo-18` → OK (7 mục đã dịch). `node scripts/validate.js` → OK — không có lỗi.

## Notes
