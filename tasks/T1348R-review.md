# T1348R — Fact-check nội dung mới của T1348

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1348 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `ms-047` (batch delete): section mới thêm — không phát hiện lỗi kỹ thuật/markup.
- `ms-048` (batch delete status code): sửa lỗi gõ chữ dính "nhân sựreload" → "nhân sự reload" trong ví dụ đời thực.
- `ms-049` (rate limit per-tenant): section mới thêm — không phát hiện lỗi kỹ thuật/markup.
- `ms-050` (multi-tenant DB): sửa mô tả Flyway/kiểm tra phiên bản sai tên bảng/cột trong ví dụ đời thực (đang dùng `schema_version`/cột không khớp chuẩn Flyway). Đổi sang tham chiếu đúng `flyway_schema_history` (bản ghi thành công mới nhất) và mô tả kiểm tra phiên bản chính xác, tránh bịa tên cột.
- `ms-051` (Kafka performance/durability): section mới thêm — không phát hiện lỗi kỹ thuật/markup.
- `ms-052` (Kafka producer batching): sửa "Nguyên gốc" → "Nguyên nhân gốc" (nhất quán), thêm khoảng trắng thiếu `(1)linger.ms` → `(1) linger.ms`, thay chữ lẫn nước ngoài "tayknob" → "nút điều chỉnh"; sửa "sticky từ 3.3" (sai mốc) → "sticky từ Kafka 2.4 trở đi" (KIP-480, default partitioner sticky cho keyless); sửa "dấu hiệulinger" dính chữ → "dấu hiệu linger". Kiểm tra các flag/số liệu/metric Kafka (acks, linger.ms, batch.size, zstd, enable.idempotence, max.in.flight, delivery.timeout.ms, record-queue-time-avg, batch-size-avg, records-per-request-avg, compression-rate-avg) — phù hợp Kafka 3.x.
- `node --check js/data/q-microservices.js` OK. `node scripts/validate.js` → OK (chỉ warning path.js có sẵn, không liên quan). Chỉ sửa `js/data/q-microservices.js` (file sở hữu). Không git commit.
