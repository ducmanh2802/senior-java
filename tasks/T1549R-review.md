# T1549R — Fact-check nội dung mới của T1549

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1549 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới (lab-incident-029, lab-incident-030) — không có lỗi kiến thức, markup hay kỹ thuật cần sửa.

- lab-incident-029 (RAG stale): checkpoint commit trước khi embeddings thành công, filter updated_at > checkpoint khiến các lần chạy sau bỏ qua revision 42 — đúng logic. Tác động 61 trích dẫn/19 đơn từ chối sai, 2.400 → dự kiến 2.404 chunk, phân biệt stale-data với hallucination bằng revision trong trace — chính xác. Khôi phục và atomic publish, freshness metric, alert, test 429 — hợp lý.
- lab-incident-030 (LLM 529 retry): max_attempts=5 bao gồm lần đầu → tối đa 5 attempt/request; 120 inbound × 5 = 600 outbound/s, hệ số khuếch đại 5; 50.000 credit / 600 ≈ 83.3s — đúng. Phân biệt credit quota nội bộ với chi phí provider thực tế — đúng, không khẳng định 529 bị tính tiền. Retry policy (backoff, jitter, deadline, circuit breaker, rate limit, budget reservation/release) — hợp lý.

Đã chạy `node scripts/validate.js` → `OK — không có lỗi.` (lần thứ 2, sau khi file đã có nội dung từ lần chạy trước).
