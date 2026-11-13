# T1564R — Fact-check nội dung mới của T1564

Status: DONE
Agent: opencode
Owns: `js/data/lessons-architecture.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1564 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **Không có lỗi kiến thức** trong nội dung mới (lesson-architecture-011, lesson-architecture-012): CQRS/read model, projector idempotent + version/buffer, saga orchestration/compensation, 2PC vs saga, Kafka/Debezium, at-least-once/out-of-order đều đúng. Markup `~~~seq` parse OK, không có backtick, `${`, ký tự lạ.
- Không sửa `js/data/lessons-architecture.js` (không có lỗi để sửa; không thêm/xoá mục).
- Đã chạy `node scripts/build-light-index.js` (theo AGENTS mục 6) → `node scripts/validate.js` in `OK — không có lỗi.`
- `node scripts/test-lessons.js`: 233/233 pass (lesson-architecture-011: 10/10, lesson-architecture-012: 13/13).
- Đề xuất cho integrator (file ngoài quyền task): thêm lesson-architecture-011/012 vào `js/data/path.js` để hết cảnh báo "bài học không nằm trong PATH".
