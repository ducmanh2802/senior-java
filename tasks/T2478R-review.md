# T2478R — Fact-check nội dung mới của T2478

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2478 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 câu hỏi được sửa trong T2478:
- spring-085: Sửa encoding tiếng Việt (từ văn bản bị lỗi encoding thành tiếng Việt chuẩn). Nội dung kỹ thuật về Spring Boot config precedence, @Profile/@ConditionalOnProperty, Spring Cloud Config, secret management — **đúng chuẩn Spring Boot 3.x**.
- spring-052: Sửa encoding tiếng Việt tương tự. Nội dung về Micrometer Observation API, custom observation, exemplar, context propagation — **đúng chuẩn Micrometer/Spring Boot 3.x**.

Không phát hiện lỗi kỹ thuật, lỗi markup, hay thuật ngữ sai. Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (chỉ có warning về độ dài đáp án ở file khác và lỗi ở lessons-spring.js — không thuộc file sở hữu).
