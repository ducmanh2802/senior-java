# T1054 — Dịch lại (nội dung đã sửa): algo-14 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-14.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-14.en.js` đã cũ: **algo-093, algo-096, algo-097, algo-098, algo-099, algo-100**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-14.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-14 → OK; node scripts/validate.js → OK.

## Notes
- Kiểm tra diff `git diff da3b5e1 8c33b3b -- js/data/algo.js`: toàn bộ thay đổi sau commit T435 là **chỉ sửa chính tả tiếng Việt trong comment code** (bỏ dấu hay viết thường) — không có thay đổi prose/nghĩa nào. Entry tiếng Anh đã có comment code bằng tiếng Anh tương đương rồi, nên `check-i18n.js` đã OK ngay.
- Chạy `node scripts/check-i18n.js algo-14` → `OK — 8 mục đã dịch.` (8 = 6 mục task + 2 mục khác trong cùng file, không bị ảnh hưởng).
- Chạy `node scripts/validate.js` → `OK — không có lỗi.` (có 2 cảnh báo không liên quan: modern-033 đáp án ngắn, và 2 bài học design không trong PATH — đều không phải file của task này).
- Không cần `node scripts/build-light-index.js` vì task này không thêm/sửa câu hỏi, bài học, algo, sd, drill, quiz hay công ty (index-light.js không bị lỗi).
