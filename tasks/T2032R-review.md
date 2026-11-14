# T2032R — Fact-check nội dung mới của T2032

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2032 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

không có lỗi kiến thức.

Kiểm tra:
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js` → `Lesson exercises OK: 276/276`
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` rồi, validate vẫn OK.
- File `js/data/lessons-spring.js` đã thêm 2 bài học mới: `lesson-spring-016` (Auto-configuration: thứ tự nạp, @Conditional, ghi overwrite) và `lesson-spring-017` (Propagation: REQUIRED/REQUIRES_NEW/NESTED + savepoint). Cả hai bài đều có body, exercises (starter/reference/tests/hints/explain) và check questions đầy đủ; reference pass 100% test, starter biên dịch được và không pass hết.
