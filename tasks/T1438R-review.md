# T1438R — Fact-check nội dung mới của T1438

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1438 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `english-068`: sửa lỗi markup — phần mới thêm "Giải nghĩa thuật ngữ (đọc trước để không vấp)" và "Useful phrases" bị chèn bằng chuỗi `\n` bị escape kép trong template literal (render ra ký tự `\n` thay vì xuống dòng). Đã thay bằng xuống dòng thật để `App.md()` render đúng heading/list.
- Các nội dung mới còn lại trong diff (articles/countable-uncountable, lỗi người Việt hay mắc, salary/offer notes, system design clarification/terminology cho `english-065`/`english-066`/`english-067`) đã rà soát: không phát hiện lỗi kỹ thuật (không API/flag bịa, không mặc định sai, không số liệu vô căn cứ; Multi-AZ/RDS failover, idempotency key, read replica/primary, cache+TTL, circuit breaker/runbook dùng đúng ngữ cảnh), không backtick/`${`, không thêm/xoá mục, không sửa nội dung ở HEAD.
- `node scripts/validate.js` → OK (chỉ còn warning có sẵn: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`). Không chỉnh văn phong/độ dài/bố cục.
