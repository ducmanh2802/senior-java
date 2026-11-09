# T1405R — Fact-check nội dung mới của T1405

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1405 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed new content in lesson-db-001 (isolation levels, MVCC diagrams/cơ chế, Lỗi hay gặp, Liên hệ phỏng vấn + 2 quiz) and lesson-db-002 (optimistic locking, retry, VersionedCounter, diagrams, Liên hệ phỏng vấn + 2 quiz). Không có lỗi kiến thức (API/flag bịa, mức isolation, SQLSTATE 40001/SSI, Hibernate @Version, row count conflict, retry hợp lý đều đúng) và không có lỗi markup (không backtick, không ${, {{ khớp, không ký tự nước ngoài). Không sửa nội dung HEAD, không thêm/xoá mục.
Da chay: node scripts/build-light-index.js, node scripts/validate.js js/data/lessons-db.js -> OK — không có lỗi.
node scripts/test-lessons.js lesson-db-001 (3/3) va lesson-db-002 (3/3) -> pass; starter khong pass het test.
