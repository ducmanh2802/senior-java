# T2391R — Fact-check nội dung mới của T2391

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2391 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi: đã fact-check 5 câu mới (microservices-098 → 102) trong js/data/q-microservices.js. Tất cả cơ chế (strangler fig/facade, tách DB 3 giai đoạn + CDC/Debezium, dual write vs outbox+CDC, reconciliation/drift/cutover, contract test + shadow traffic) đúng kỹ thuật Java 17/Spring Boot 3/Kafka 3/PostgreSQL. Không có backtick/`${` trong nội dung, seq diagram và bảng markup hợp lệ, refs hợp lệ, ID không trùng. validate.js không báo lỗi liên quan đến file này (các lỗi còn lại là trong lessons-claude.js/path.js — không sở hữu).
