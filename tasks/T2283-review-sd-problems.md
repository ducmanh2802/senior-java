# T2283 — Rà soát chất lượng các bài system design trong sd-problems.js

Status: DONE

## Notes
- Các bài đã kiểm tra kỹ:
  - sd-001 (Chuyển tiền liên ngân hàng): Đúng, ước lượng và giải pháp chặt chẽ.
  - sd-002 (Sổ cái double-entry): Đúng, kiến trúc chuẩn, giải thích point-in-time balance rõ ràng.
  - sd-003 (OTP): Đúng, bảo mật tốt, tách biệt service.
  - sd-004 (Sao kê): Đúng, xử lý batch batch tốt.
  - sd-005 (Fraud): Đúng, kết hợp rules+ML rõ ràng.
  - sd-006 (URL shortener): Đúng, thiết kế key-value scale tốt.
  - sd-007 (Rate limiter): Đúng, thuật toán và triển khai Redis hợp lý.
- Không tìm thấy lỗi cần sửa.

Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2171

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài system design (`node scripts/qtool.js list js/data/sd-problems.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: capacity estimate tính đúng, thành phần và trade-off hợp lý, có sơ đồ ~~~seq cho luồng chính; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Reviewed-by: verify-only (review task)
