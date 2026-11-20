# T2511R — Fact-check nội dung mới của T2511

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2511 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- architecture-073: Sửa sai kỹ thuật "mỗi 30 phút ES flush" → Elasticsearch flush được kích hoạt bởi kích thước translog (mặc định 512 MB) hoặc flush thủ công, không phải timer 30 phút. Translog được fsync định kỳ 5 giây. Đã sửa đoạn mô tả thành: "Khi translog quá lớn (mặc định 512 MB) hoặc flush thủ công, ES flush: commit Lucene và xóa translog đã commit. Translog cũng được fsync định kỳ (mặc định 5 giây) để bền."
- architecture-072: Không có lỗi kỹ thuật. Nội dung về inverted index, analyzer (char filter, tokenizer, token filter), text vs keyword, BM25, multi-field, ví dụ curl/java client chính xác.
- architecture-074: Không có lỗi kỹ thuật. Outbox + CDC (Debezium) pattern, external versioning, search_after vs from+size, PIT, alias reindex - tất cả đúng kỹ thuật.
