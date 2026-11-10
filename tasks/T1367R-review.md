# T1367R — Fact-check nội dung mới của T1367

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1367 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới của T1367 trong `js/data/q-system-design.js`:

1. **Multi-tenancy (architecture-015)**: Thêm "Ví dụ đời thực" (sự cố rò rỉ 120 bản ghi do SQL thô bỏ qua filter + thiếu RLS) và "Trả lời mẫu khi phỏng vấn". Kỹ thuật đúng: `SET LOCAL app.tenant_id`, RLS PostgreSQL, PgBouncer transaction mode, test tenant isolation trong CI.

2. **Event Sourcing (architecture-027)**: Thêm "Ví dụ đời thực" (tài khoản 60k event, p95 2.8s → 150ms sau snapshot 500 event) và "Trả lời mẫu". Kỹ thuật đúng: snapshot là tối ưu không phải nguồn sự thật, upcasting cho schema evolution, crypto-shredding cho GDPR.

3. **Cell-based Architecture (architecture-028)**: Thêm "Ví dụ đời thực" (20k tenant cụm đơn → 20 cell, blast radius 5%) và "Trả lời mẫu". Kỹ thuật đúng: router stateless, control plane tách data plane, tenant-to-cell mapping table, tenant lớn tách cell riêng.

4. **FinOps/Cloud Cost (architecture-029)**: Thêm "Ví dụ đời thực" (AWS bill $6.2k → $14.8k, giảm 45% sau tối ưu log/NAT/worker) và "Trả lời mẫu". Kỹ thuật đúng: cost per 1000 orders, tag service/env, reserved/spot mix, không cắt HA để rẻ.

5. **Architecture Decision/RFC (architecture-030)**: Thêm "Ví dụ đời thực" (team 8 người tranh luận 3 tuần tách service thanh toán, RFC + spike 3 ngày → quyết định giữ modular monolith + ArchUnit) và "Trả lời mẫu". Quy trình đúng: RFC → chốt tiêu chí → spike time-box → ADR với mốc review.

6. **Notification Service (design-030)**: Viết lại toàn bộ đáp án mở rộng chi tiết: at-least-once + dedup (Redis SET NX EX), queue riêng theo kênh, priority OTP > giao dịch > marketing, full jitter retry, circuit breaker per provider, DLQ, real-world case marketing làm OTP trễ 8 phút → fix 99% OTP < 4s.

Không tìm thấy lỗi kỹ thuật, lỗi markup (backtick, `${`), hay tiếng nước ngoài lẫn vào. `node scripts/validate.js` → OK.
