# T1574R — Fact-check nội dung mới của T1574

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1574 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa lỗi markup (inline code chứa dấu `{}` lồng nhau) trong 2 câu hỏi mới:
- **api-043**: 3 vị trí `{{WHERE id IN (...)}}` và `{{users(limit: 1000) { transactions { merchant { ... } } }}}` → chuyển sang code block `~~~text~~~` / `~~~graphql~~~`
- **api-044**: 3 vị trí `{{http_server_requests_seconds_count{status=~"5.."}}}`, JSON log example, `{{%X{trace_id} %X{span_id}}}` và `{{%X{trace_id}}}` → chuyển sang code block `~~~text~~~` / `~~~json~~~`

Không phát hiện lỗi kiến thức kỹ thuật (API, flag, cơ chế, số liệu đều đúng với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x).
