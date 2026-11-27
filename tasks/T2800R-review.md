# T2800R — Fact-check nội dung mới của T2800

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2800 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo id, chỉ sửa kiến thức, không viết lại văn phong/bố cục):
- banking-100 (q-banking.js:7464): từ lạ "causa" → viết lại tiếng Việt ("gửi lại file trùng thì bị khớp lại").
- banking-101 (q-banking.js:7513): mã in-flight lock có race condition (check-then-insert không khóa → 2 request song song cùng tạo PENDING, hold đôi lần) → bổ sung `SELECT ... FOR UPDATE` (dùng `taiKhoanRepo.lockForUpdate`) trước khi kiểm tra PENDING.
- banking-103 (q-banking.js:7684): số liệu mâu thuẫn "lệch 1.2 tỷ VND" vs "thiếu bút toán Có 1.2 tỷ USD" → sửa thành "1.2 tỷ VND" (khớp tổng Nợ 5.2 tỷ − Tổng Có 4 tỷ).
Không có lỗi kiến thức khác ở banking-102. Chỉ sửa file sở hữu (q-banking.js); đã chạy build-light-index.js rồi validate.js q-banking.js → OK. Các lỗi còn lại của validate.js toàn trong file không sở hữu (upwork-cases-1.js, quiz-ops.js, lessons-payments.js), không được sửa theo luật 3 AGENTS.md.
