# T83R — Fact-check nội dung mới của T83

Status: DONE — đã fact-check 5 bài học modern; node --check, test-lessons và validate đều đạt.
Agent: opencode
Owns: `js/data/lessons-modern.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T83 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-modern-001`: bỏ heuristic N × Q > 10.000 không có căn cứ; làm rõ parallelism của common pool có thể cấu hình và chỉnh mô tả xử lý stateless/stateful.
- `lesson-modern-002`: bỏ khẳng định `Optional.empty()` là singleton; nói chính xác Optional biểu đạt chứ không ép caller xử lý; làm rõ serialization/Jackson/JPA và tránh xem việc dùng Optional làm tham số/field là điều cấm tuyệt đối.
- `lesson-modern-003`: nêu rõ record không bảo đảm bất biến sâu; sửa giải thích khả năng dùng record làm JPA entity và giới hạn proxy; giới hạn khẳng định exhaustive vào switch expression; sửa câu Senior tip bị lỗi ký tự.
- `lesson-modern-004`: sửa mô tả receiver/`this` của method reference và lỗi diễn đạt trong phần lỗi thường gặp.
- `lesson-modern-005`: đã rà soát Java time, múi giờ và quy tắc cut-off cùng các test; không phát hiện lỗi cần sửa.
