# T2482R — Fact-check nội dung mới của T2482

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2482 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

không có lỗi kiến thức. Toàn bộ thay đổi trong `js/data/lessons-claude.js` (lesson-claude-009) chỉ là điền dấu thanh ( Vietnamese diacritics) cho các từ đã thiếu: title, goals, body, exercise prompt/title, hints, explain, check q/options/explain, reference code comments. Không có thay đổi nào về nội dung kỹ thuật, markup, code, hay số liệu. Kiểm tra:

- `node --check js/data/lessons-claude.js` → syntax OK.
- `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js` (chỉ cập nhật title lesson-claude-009 theo đúng file).
- `node scripts/validate.js` → không có lỗi nào liên quan đến lessons-claude.js (lỗi còn lại thuộc lessons-spring.js do task khác sở hữu).
- `node scripts/test-lessons.js` → các bài học claude đều pass (344/348, 4 fail thuộc spring do task khác).
