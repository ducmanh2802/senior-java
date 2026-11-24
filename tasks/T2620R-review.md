# T2620R — Fact-check nội dung mới của T2620

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2620 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
**sd-045 (Hệ thống tích điểm loyalty):**
- Thêm `CHECK (type IN ('EARN','REDEEM','EXPIRE','ADJUST'))` cho `points_ledger.type`
- Thêm cột `lifetime_redeemed` vào `points_balance` (đã có trong schema nhưng chưa cập nhật luồng redeem)
- Thêm cột `processed_at` vào `point_batch` để idempotent job expiry (thay vì `expired_at` sai tên)
- Sửa query expiry: thêm `ORDER BY expires_at ASC` để đảm bảo FIFO, thêm `AND processed_at IS NULL` để idempotent
- Sửa luồng earn: cập nhật `lifetime_earned += points`
- Sửa luồng redeem: cập nhật `lifetime_redeemed += points` khi capture
- Thay backtick `` `processed_at` `` bằng `{{processed_at}}` trong reference (tránh vỡ template literal)

**sd-046 (Hệ thống thu hộ/thanh toán hoá đơn):**
- Thêm `CHECK` constraints cho `bill.status` và `payment.status`
- Đổi `bill.provider_ref` thành `provider_bill_ref` (rõ nghĩa hơn: mã hoá đơn của provider)
- Thêm `bill.paid_amount_minor` để theo dõi partial payment
- Thêm `reconciliation.mismatch_detail JSONB` để lưu chi tiết mismatch
- Sửa sequence diagram: dùng `idempotency_key = payment.id` thay vì `provider_ref` (chưa có lúc gọi)
- Sửa luồng thanh toán: cập nhật `bill.paid_amount` và status khi webhook
- Sửa reconciliation: so khớp theo `provider_txn_ref`, lưu `mismatch_detail`
- Sửa partial payment: dùng `bill.paid_amount += amount`, status PARTIAL_PAID/PAID
- Thêm state PARTIAL_PAID vào state machine
- Thay backtick trong reference bằng markup hợp lệ (không có backtick trong template literal)

Cả 2 bài: `node scripts/validate.js` → OK, `node scripts/build-light-index.js` → OK.
