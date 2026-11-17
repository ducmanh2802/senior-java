# T2293R — Fact-check nội dung mới của T2293

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2293 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- qz-ccap-211: sửa lỗi thiếu dấu cách "làdeterministic" → "là deterministic" (nghĩa là xác định, không ngẫu nhiên). Đây là lỗi chèn chữ Việt vào từ tiếng Anh.
- Các quiz khác (qz-ccap-161 → qz-ccap-220): không phát hiện lỗi kiến thức kỹ thuật, markup hay chữ nước ngoài lẫn vào.
- `node scripts/validate.js js/data/quiz-ccap-2.js` → OK. Lỗi `labs-thread.js` (lab-thread-007, lab-thread-008) là pre-existing, thuộc task T2296, không phải quyền sở hữu của task này.
- `node scripts/build-light-index.js` đã chạy để sinh lại `js/data/index-light.js` sau khi thêm quiz.