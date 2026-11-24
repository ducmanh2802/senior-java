# T2661R — Fact-check nội dung mới của T2661

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2661 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi kỹ thuật trong 2 bài system design mới (sd-051, sd-052):

**sd-051 (Credit scoring):**
- Sửa typo "exPhanations" → "exPlanations" trong giải thích SHAP
- Sửa từ tiếng Tây "Semana" → "Tuần" trong ví dụ đời thực
- Sửa công thức điểm tín dụng: `log` → `ln` (natural log, chuẩn credit scoring)
- Sửa mâu thuẫn: bureau timeout 800ms > SLA 500ms → điều chỉnh timeout per nguồn 100-300ms, tổng < 500ms p99 nhờ cache hit rate cao; cập nhật Estimation, Feature aggregator, Deep dive guide

**sd-052 (Livestream shopping):**
- Thêm `livestream_id` vào bảng `stock_reservation` (consistent với atomic reserve SQL dùng composite key livestream_id+sku_id)
- Thêm `UNIQUE` constraint cho `cart.idem_key`防重
- Bổ sung atomic reserve cho `gift_sku` trong coupon BUY_X_GET_Y
- Làm rõ WebSocket servers consume Kafka as **consumer group** (không phải single consumer)
- Làm rõ Cart Service: Redis cho hot access + async persist PostgreSQL (dual-write pattern)
- Cập nhật release SQL comment: lấy `livestream_id` từ reservation

Validator: `node scripts/validate.js` OK cho SD_PROBLEMS (12 kịch bản). build-light-index fail do lỗi cũ lessons-aws.js (không liên quan file sở hữu).
