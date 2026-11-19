# T2469R — Fact-check nội dung mới của T2469

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2469 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check hoàn tất. Không có lỗi kiến thức kỹ thuật nào trong phần diff (chỉ có 4 câu hỏi được sửa, tất cả đều chỉ thêm dấu tiếng Việt đúng chính tả, nội dung kỹ thuật đã đúng):

- `modern-072` (Java 21 preview features, string templates bị rút, structured concurrency/ScopedValue preview): thông tin JEP 430/459/481/490 chính xác, phân biệt preview vs stable đúng.
- `modern-073` (G1 vs ZGC generational): so sánh pause/throughput/CPU/bộ nhớ đúng, allocation stall được giải thích đúng, đề xuất đọc GC log + JFR hợp lý.
- `core-070` (BigDecimal, bankers rounding): ROUND_HALF_UP vs ROUND_HALF_EVEN đúng, scale định định, không dùng double cho tiền — đúng.
- `core-071` (immutable class, thread-safe, defensive copy): private final, không setter, copy hai chiều, record cần tự copy component — đúng.

`node scripts/validate.js` không báo lỗi gì ở file `js/data/q-java.js` (các lỗi khác thuộc về file không phải quyền sở hữu).
