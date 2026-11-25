# T2723R — Fact-check nội dung mới của T2723

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2723 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi chính tả/kỹ thuật trong 3 câu hỏi mới (banking-094, banking-095, banking-096):

1. **banking-094** (phát hiện gian lận):
   - "thẻ capping" → "thẻ cắp" (trong Trả lời mẫu khi phỏng vấn)
   - "theo só tỷ lệ" → "theo dõi tỷ lệ" (trong Senior tip)

2. **banking-095** (chargeback/representment):
   - "đuợi tiền lại" → "đòi tiền lại" (trong Tóm tắt)

3. **banking-096** (lệnh định kỳ/direct debit): Không có lỗi, nội dung kỹ thuật đúng.

`node scripts/validate.js` → OK (không lỗi cho file q-banking.js). Đã chạy `node scripts/build-light-index.js`.
