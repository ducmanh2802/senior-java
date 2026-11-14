# T1725R — Fact-check nội dung mới của T1725

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1725 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- sd-041 (Nền tảng đánh giá LLM): Sửa lỗi đánh máy "kwh?" thành "và độ lệch chuẩn" trong phase Deep dive guide (line 5463). Không có lỗi kiến thức kỹ thuật khác; nội dung đúng về LLM-as-judge (position bias, verbosity bias, self-preference, calibration, variance handling), kiến trúc async job queue + worker pool, rate limiting, regression gating, và chi phí token.
- sd-042 (Phát hiện gian lận real-time): Không có lỗi. Nội dung đúng về tách luồng sync scoring (<100ms) vs async stream processing, event time/watermark/sliding window, RocksDB state backend + checkpoint, idempotent update theo txn_id, hot key sharding, fail-open/fail-closed theo loại giao dịch, rule engine + ML model kết hợp, drift monitoring, và vòng phản hồi false positive.
- node scripts/validate.js → OK.
