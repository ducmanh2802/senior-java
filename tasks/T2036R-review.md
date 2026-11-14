# T2036R — Fact-check nội dung mới của T2036

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2036 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `qz-spring-040`: sửa gõ nhầm propagation không tồn tại `SUPPORTS/FORAYS` → `SUPPORTS/NOT_SUPPORTED` trong Senior tip (đúng kỹ thuật, chỉ fix tên propagation chuẩn Spring).
- Các mục mới còn lại (`qz-spring-030`–`qz-spring-041`) đã kiểm tra: kỹ thuật đúng theo Spring Boot 3.x / Spring Security 6 / Spring Framework 6, markup hợp lệ, không backtick/`${` trong template literal, giải thích và đáp án nhất quán. Không sửa thêm.
- Kiểm tra: `node --check js/data/quiz-spring.js` OK, `node scripts/validate.js` → `OK — không có lỗi.`
