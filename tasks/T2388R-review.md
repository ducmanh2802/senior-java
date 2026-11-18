# T2388R — Fact-check nội dung mới của T2388

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2388 (xem `git diff HEAD -- <file>`) do model free viết, ĐÃ review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÍNH PHẢN KIẾN THỨC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: node scripts/test-lessons.js → 328/328 pass.

## Notes
- lessons-security.js: 14 bài học (lesson-security-001 → lesson-security-014), schema hợp lệ, test-lessons.js pass 328/328
- validate.js có lỗi phân tán ở các file khác (quiz-java.js, labs-incident.js, lessons-claude.js, index-light.js, path.js, q-security.js, q-concurrency-jvm.js) nhưng theo rule 3 AGENTS.md chỉ sửa file task sở hữu
- Không có lỗi kiến thức, markup hoặc cấu trúc trong lessons-security.js
