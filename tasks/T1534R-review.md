# T1534R — Fact-check nội dung mới của T1534

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1534 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã rà soát nội dung mới của T1534: `lesson-ai-007`, `lesson-ai-008`.
- `lesson-ai-007`: sửa câu về `maxSteps` cho khớp code và test — trần 5 là tối đa 5 lượt model; nếu cả 5 lượt đều là tool call thì kết thúc `finished=false`, không mặc định còn một bước tổng hợp.
- `lesson-ai-008`: thay cụm tiếng Anh lẫn vào "raw input" bằng "dữ liệu thô" trong Senior tip.
- Không phát hiện lỗi API/flag bịa, mặc định sai, markup hay số liệu khác.
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo `path.js` còn 9 bài học chưa nằm trong PATH, gồm `lesson-ai-007`/`lesson-ai-008`; file ngoài phạm vi).
- `node scripts/test-lessons.js` → 227/227 pass; chạy riêng `lesson-ai-007` (4/4) và `lesson-ai-008` (6/6).
