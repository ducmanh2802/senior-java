# T2277 — Rà soát chất lượng các bài lab sự cố trong labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2146

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài lab sự cố (`node scripts/qtool.js list js/data/labs-incident.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact tự nhất quán (timestamp, số liệu, tên service khớp answer); rubric ≥3 ý đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Kiểm tra file `js/data/labs-incident.js` (38 bài lab sự cố): artifact timestamp/số liệu/tên service khớp với answer; rubric ≥3 ý; không phát hiện lỗi markup (backtick/`${`).
- Id đã kiểm tra kỹ: lab-incident-001 (timeout/retry chain), lab-incident-006 (Hikari pool), lab-incident-009 (retry storm) — số liệu và kết luận khớp nhau, không cần sửa.
- `node --check`, `build-light-index.js`, `validate.js` → OK.
