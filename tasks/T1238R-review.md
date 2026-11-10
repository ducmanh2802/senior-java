# T1238R — Fact-check nội dung mới của T1238

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1238 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed typo in spring-010: "nuoton" → "nuốt" (Vietnamese typo in "exception bị nuoton" section heading)
- No technical errors found in the new content for spring-002, spring-007, spring-008, spring-009, spring-010, spring-013
- All markup syntax is valid ({{...}}, ~~~java, ~~~yaml, ~~~json, ~~~text)
- No foreign language characters detected
- Validation passes for q-spring-data.js (the stale index-light.js warning is due to a pre-existing syntax error in q-java.js which is not owned by this task)
