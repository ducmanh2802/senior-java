# T62R — Fact-check nội dung mới của T62

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T62 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `design-014`: sửa mô tả giao thức NAPAS thành phụ thuộc đặc tả dịch vụ; làm rõ ngưỡng xác thực sinh trắc học (>10 triệu/lần hoặc >20 triệu/ngày theo Quyết định 2345) và không khẳng định cơ chế/chu kỳ settlement chung.
- `design-015`: làm rõ PostgreSQL sequence cấp đầu block, không tự cấp sẵn block cho từng instance.
- `design-017`: giới hạn khẳng định deterministic vào trường hợp journal ghi đủ thứ tự input và quyết định ngoại vi.
- `design-018`: bỏ khẳng định tuyệt đối về SQL prefix search; khả năng chịu tải phụ thuộc index/cache và thiết kế.
- `design-019`: bỏ khẳng định Kafka bảo đảm không mất log; bổ sung giới hạn retention/dung lượng, lag và buffer đầy.
- `design-020`: đánh dấu counter minh họa cần cập nhật INCR+TTL nguyên tử và idempotency khi retry.
- `design-021`: tránh khóa cứng tài khoản chỉ từ request chưa xác thực để không tạo lỗ hổng DoS.
- `architecture-021`: sửa chiều phụ thuộc giữa domain và persistence adapter; mô tả đúng mặc định fail-on-empty của ArchUnit.
- `architecture-022`: tenant resolver fail-closed thay vì tenant mặc định `system`; xác thực tenant từ host, dùng transaction-local RLS với pool, giới hạn schema vào registry tin cậy.
- Kiểm tra `node --check js/data/q-system-design.js` và `node scripts/validate.js`: `OK — không có lỗi.`
