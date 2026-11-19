# T2435R — Fact-check nội dung mới của T2435

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2435 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- scenario-161: Sửa lỗi toán học trong ví dụ đời thực — gốc ghi `max.poll.interval.ms` default 5 phút (300s) nhưng `batch 1000 records × 100ms = 100s > 5m → rebalance` (sai, 100s < 300s). Đã sửa: config `max.poll.interval.ms=60000` (60s, set thấp để fail-fast), batch 500 records, N+1 query + downstream API p99 500ms khiến processing time ~300s/batch > 60s → rebalance (đúng).
- scenario-160, scenario-162, scenario-163: Không có lỗi kỹ thuật, markup đúng, thuật ngữ tiếng Anh chuẩn.
- Validation: scenario topic 163 câu hỏi (bao gồm 4 câu mới) pass validate, không lỗi mới.
