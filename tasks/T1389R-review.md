# T1389R — Fact-check nội dung mới của T1389

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1389 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới của T1389 (git diff js/data/q-system-design.js):
1. Phần mở rộng cho design-035: "Ví dụ đời thực: số dư hiển thị nhảy lên xuống sau khi rút tiền" + "Trả lời mẫu khi phỏng vấn" — mô tả đúng kịch bản stale read do async replication, conditional UPDATE làm fencing ở DB, mitigation UX hợp lý, trả lời phỏng vấn chuẩn.
2. Câu hỏi mới design-036: Proxy/Decorator/Adapter — phân biệt đúng ba mẫu, Spring AOP proxy self-invocation pitfall, java.io decorator chain, Spring MVC HandlerAdapter, bảng so sánh chính xác, ví dụ thực tế Proxy cho access control, trả lời phỏng vấn đúng trọng tâm.
Không phát hiện lỗi kỹ thuật, lỗi markup, hay từ ngữ nước ngoài lẫn vào. Validation và build-light-index đều OK.
