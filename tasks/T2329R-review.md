# T2329R — Fact-check nội dung mới của T2329

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2329 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (tất cả trong nội dung mới devops-170 → devops-179, file `js/data/q-devops.js`):
- devops-171.a: bảng SLI dùng inline code `{{...}}` chứa dấu `{ }` lồng nhau (`{code=~...}`) và ký tự `|` (bị tách cột khi parse bảng) — chuyển PromQL vào khối `~~~promql` riêng, ô bảng viết tiếng Việt plain text.
- devops-171.a: ngưỡng alert "burn rate ≥ 10% (1x)" sai đơn vị — sửa thành "burn rate ≥ 1x".
- devops-173.a: fences `~~~` lẻ (`~~~groovy` viết giữa dòng không được tính mở, còn `~~~` đóng ở đầu dòng tính) — viết lại thành khối `~~~groovy` đứng riêng.
- devops-172.a: Senior tip trích view `pg_stat_progress_alter_table` (PostgreSQL không có view này) — sửa thành `pg_stat_activity` (truy vấn đang chờ khóa) kèm `pg_locks`.
- devops-170.follow: 3 câu follow-back chép nhầm từ devops-174 (MAT/NMT/ThreadLocal, không liên quan tracing) — đổi thành câu về OTel tracing (Baggage, head vs tail sampling, context của Kafka consumer trên thread pool riêng).

Không sửa: nội dung đã có ở HEAD; các file khác sở hữu bởi integrator (quiz-ccao-2.js, q-banking.js vẫn báo lỗi validate do lỗi cũ của HEAD, không phải do task này).

Chạy `node scripts/build-light-index.js` + `node scripts/validate.js` → không còn lỗi nào thuộc `js/data/q-devops.js`.