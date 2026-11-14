# T1728R — Fact-check nội dung mới của T1728

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1728 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới T1728 (qz-design-036 → qz-design-050), đã sửa 1 lỗi:

- **qz-design-048** (API error response): answer `[0, 3]` mâu thuẫn với explain — explain tự nhận định phương án 3 ("Không cần mã lỗi riêng, chỉ cần thông điệp tiếng Việt là đủ") là sai (client không lập trình theo được, thông điệp thay đổi là vỡ client). Chỉ phương án 0 mới đúng. Đã sửa: bỏ `multi: true`, `(Chọn 2)` → `(Chọn 1)`, answer `[0, 3]` → `0` (single). Sau khi sửa, `node scripts/validate.js` → OK.

Các câu còn lại (qz-design-036, 037, 038, 039, 040, 041, 042, 043, 044, 045, 046, 047, 049, 050) đã kiểm tra kiến thức: đúng kỹ thuật (Kafka quorum/ISR, HTTP method/status, keyset pagination, pgvector HNSW/ivfflat, RAG ACL/audit, LLM streaming/TTFT, token bucket, multipart/resumable upload, poll vs CDC/WAL, chat offline/sequence number, notification queue/idempotency/DLQ, cache TTL vs oversell, Elasticsearch outbox/reconciliation, Saga compensation/2PC). Không phát hiện lỗi markup (không backtick, không `${`, không `{}` lồng nhau), không chữ nước ngoài lẫn vào.
