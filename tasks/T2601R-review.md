# T2601R — Fact-check nội dung mới của T2601

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2601 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `concurrency-093`: Sửa 2 lỗi kỹ thuật:
  1. Pinning với `synchronized`: JDK 21 **vẫn pin trên TẤT CẢ** khối `synchronized` (không phải "một số trường hợp"). JDK 24 (JEP 491) mới bỏ pinning cho hầu hết trường hợp.
  2. MDC/ThreadLocal propagation: Virtual thread **kế thừa ThreadLocal từ thread cha** khi tạo qua `Thread.ofVirtual().start()` hoặc structured concurrency. Spring Boot 3.2+ tự propagate MDC; chỉ cần copy thủ công khi tự quản lý thread.
  → Đã sửa section "Pinning với synchronized trên JDK 21/24", section "ThreadLocal và MDC", và "Trả lời mẫu khi phỏng vấn".
- `concurrency-094`: Không có lỗi kỹ thuật.
- `concurrency-095`: Không có lỗi kỹ thuật.
