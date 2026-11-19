# T2483R — Fact-check nội dung mới của T2483

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2483 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-concurrency-014: Thêm 2 quy tắc happens-before bị thiếu trong bảng: **Thread interrupt** (`t.interrupt()` happens-before thread phát hiện interrupt) và **Final field** (ghi field final trong constructor happens-before các đọc sau khi constructor xong, nếu không để lộ `this`). Nguyên bản lesson 001 đã có quy tắc Final field; lesson 014 mới bị thiếu.
- Kiểm tra validate: `node scripts/validate.js` → OK (không lỗi trong lessons-concurrency.js).
- Kiểm tra bài tập: `node scripts/test-lessons.js` → 344/348 pass, 4 failures đều ở Spring lessons (không thuộc sở hữu).
