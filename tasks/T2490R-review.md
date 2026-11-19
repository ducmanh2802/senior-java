# T2490R — Fact-check nội dung mới của T2490

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2490 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức trong design-071/072/073 (cơ chế Kafka partition theo machineId, TimescaleDB hypertable, event sourcing PostgreSQL, OEE công thức, số liệu tính toán đều đúng; markup sạch: không backtick, không `${`, fence khép, bảng hợp lệ).

Sửa chữ nước ngoài lẫn vào tiếng Việt:
- design-071: "thứ tự per máy" → "thứ tự theo máy" (bảng trade-off)
- design-072: "allocate range per line" → "allocate range theo từng line" (trả lời mẫu)
- design-073: "invest vào ... optimize dashboard" → "đầu tư vào ... tối ưu dashboard" (Senior tip)

`node --check js/data/q-system-design.js` → SYNTAX_OK; `node scripts/validate.js q-system-design.js` → OK — không có lỗi.
