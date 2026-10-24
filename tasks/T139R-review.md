# T139R — Fact-check nội dung mới của T139

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T139 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-devops-001: sửa cú pháp `explain` (backtick sai vị trí, nội dung `.` và `,` ngoài template literal); thêm `> Senior tip:` đúng markup (`{{...}}` cho inline code, không dùng backtick nội bộ).
- lesson-devops-002: thêm `> Senior tip:` đúng markup.
- lesson-devops-003: thêm `> Senior tip:` đúng markup và đóng `explain` đúng (`.` rồi backtick rồi `,`).
- Kiểm tra nội dung kỹ thuật: các API (`MaxRAMPercentage`, `UseContainerSupport`, `ParallelGCThreads`, `ActiveProcessorCount`, `String.hashCode`, `Math.floorMod`) đúng chuẩn Java 17/Spring Boot 3; công thức sizing đúng; không thêm/xoá mục; `node scripts/validate.js` → OK; `node scripts/test-lessons.js` → 72/72.
