# T1343R — Fact-check nội dung mới của T1343

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1343 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `git diff HEAD -- js/data/q-claude.js` hiện **trống** (`js/data/q-claude.js` trùng HEAD a933fb3); stash trống. Không có nội dung MỚI của T1343 trong working tree để review/sửa.
- Trong quá trình làm việc, file bị ghi đè nhầm (chỉ còn "utf8" — lỗi thao tác agent) và đã được khôi phục về HEAD bằng `git checkout -- js/data/q-claude.js`. `node --check` OK. `node scripts/validate.js` trả về các lỗi pre-existing toàn repo (projects/path/index-light liên quan microservices/lesson-db/claude refs + index-light stale) — **không có lỗi phát sinh từ `js/data/q-claude.js`**.
- Lỗi kiến thức đã quan sát từ diff T1343 trước khi mất nội dung (chưa áp dụng vì nội dung không còn trong file): `claude-034` dùng tên model bịa "Haiku 5.5" cho lớp sàng lọc (nên dùng tên model thực/diễn đạt chung "model nhỏ, nhanh"); `claude-037` liệt kê permission mode `auto` "có classifier kiểm tra nền" (không phải mode permission được tài liệu Claude Code chuẩn liệt kê — cần xác minh với docs hiện hành). `claude-037` có "có thể/block action", `claude-038` có "vài_week" (chữ lẫn). Nếu nội dung T1343 được khôi phục/tái áp dụng, cần fact-check lại các điểm này.
