# T2797R — Fact-check nội dung mới của T2797

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2797 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Sửa các lỗi kỹ thuật trong nội dung mới của T2797 (file `js/data/q-soft.js`), theo từng id:
- testing-081: sai phép tính minh hoạ ("400 test × 10 giây = 20 phút" sai) → sửa thành "khoảng 67 phút".
- testing-082: sai mô tả mặc định của `@Sql` (nói chạy "sau rollback" / trong transaction riêng ⇒ không bị rollback) → sửa thành mặc định `@Sql` chạy trong transaction test và bị rollback theo; chỉ rò dữ liệu nếu cấu hình chạy tách biệt (transactionMode) hoặc datasource ngoài transaction. Cập nhật nhất quán ở tóm tắt, điểm 2, bẫy, và trả lời mẫu.
- testing-085: lỗi gõ "jobfinally" → "cần dọn dẹp cuối job".

Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục; không sửa nội dung đã có tại HEAD. Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js`: không có lỗi/cảnh báo nào liên quan đến q-soft.js (các lỗi còn lại của validate là trong file không sở hữu bởi task này, không đụng vào).
