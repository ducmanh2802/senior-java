# T1258R — Fact-check nội dung mới của T1258

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1258 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Sửa trực tiếp lỗi trong 6 block `### Ví dụ đời thực` mới (microservices-007 → 012), không độngHEAD:
- microservices-007: `enable jitter` → `bật jitter`; `bulkhead 25 ... làm cạn thread pool` (cơ chế nói ngược: bulkhead ngăn cạn, không gây cạn) → `ngăn cạn thread pool`.
- microservices-008: `system tự hồi phục` → `hệ thống tự hồi phục` (Ví dụ đời thực).
- microservices-009: `developer forget update consumer` → `lập trình viên quên cập nhật consumer`; `customer không nhận được` → `khách hàng không nhận được`; `(2)bật` → `(2) bật`.
- microservices-010: `xử lý xong then delete message` → `xử lý xong xóa message`; `(1) set visibility timeout` → `(1) đặt visibility timeout`; `(change message visibility)` → `(gia hạn visibility timeout)`.
- microservices-011: `tự owning BFF` → `tự sở hữu BFF`.
- microservices-012: `correlation id không propagate qua Kafka` → `không được truyền qua Kafka`; `(3) enable OTel Java agent` → `(3) bật OTel Java agent`; `(auto instrument ...)` → `(tự động đo lường ...)`.
microservices-010 và microservices-012 không có lỗi kỹ thuật ngoài chữ nước ngoài trên.
Lỗi index-light.js cũ là toàn repo, không thuộc phạm vi file này (index-light không index nội dung đáp án), để integrator xử lý.
node scripts/validate.js js/data/q-microservices.js → OK (chỉ cảnh báo index-light stale, toàn repo). node --check OK.
