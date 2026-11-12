# T1530R — Fact-check nội dung mới của T1530

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1530 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD vs working: nội dung mới là `lesson-claude-004` và `lesson-claude-005` (thêm vào cuối `js/data/lessons-claude.js`).
- Kiểm tra kỹ thuật (Messages API tool use/tool_result, stop_reason, pause_turn/max_tokens, prompt caching concepts trong ngữ cảnh bài học, JSON Schema subset, authorization/validation separation, ví dụ Java 17): không phát hiện lỗi kiến thức, API/flag bịa, cơ chế sai, hay markup vi phạm (không backtick, không `${`).
- `node --check js/data/lessons-claude.js` OK. `node scripts/test-lessons.js` → `Lesson exercises OK: 223/223`. `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo có sẵn: `lesson-claude-004`, `lesson-claude-005` chưa nằm trong PATH — không thuộc phạm vi sửa file task này).
- Kết luận: không có lỗi kiến thức.
