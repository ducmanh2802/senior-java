# T2241 — Rà soát chất lượng các câu tag 'core' trong q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2199

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu tag 'core' (`node scripts/qtool.js list js/data/q-system-design.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: ước lượng capacity có số liệu hợp lý (QPS, storage, bandwidth) và phép tính đúng; có sơ đồ ~~~seq hoặc bảng thành phần; trade-off nêu rõ khi nào chọn; sửa số liệu bịa.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Rà soát toàn bộ 32 câu tag `core` trong `js/data/q-system-design.js` (design-002→design-013; architecture-001, 003, 004; design-014, 015, 016, 021, 029; architecture-009, 010, 011, 012, 014, 015, 020, 023, 027, 040, 044, 052).

| id | lỗi tìm thấy | đã sửa gì |
|----|--------------|-----------|
| design-002 | Không | Đã xem xét: ước lượng 40 writes/s, 4.000 reads/s, 50 GB/tháng, 600 GB/năm, 62^7 ≈ 3.5×10^12 đúng; bảng so sánh 301/302, ASCII diagram, trade-off rõ. |
| design-003 | Không | Đã xem xét: 100 req/min, 10.000 partner; bảng so sánh thuật toán, Lua script nguyên tử, trade-off fail-open/fail-closed rõ. |
| design-004 | Không | Đã xem xét: 100k req/s, 1.000 sản phẩm; ASCII diagram, bảng lỗi oversell, Lua + conditional UPDATE, trade-off bucket/serialize rõ. |
| design-005 | Không | Đã xem xét: double-entry ledger, idempotency key, outbox, saga, reconciliation; bảng lỗi, ví dụ thực tế có số liệu, trade-off rõ. |
| design-006 | Không | Đã xem xét: 1M thông báo/ngày, peak 10k/phút; ASCII diagram, bảng ưu tiên/retry, ví dụ thực tế OTP chậm, trade-off at-least-once rõ. |
| design-007 | Không | Đã xem xét: 50M DAU, 11.500 reads/s, 1 tỷ feed entries/ngày; bảng so sánh push/pull, ASCII diagram, hybrid celebrity, trade-off rõ. |
| design-008 | Không | Đã xem xét: 10M kết nối đồng thời; bảng sự cố, ASCII diagram, sequence number, at-least-once, trade-off pull nhóm lớn rõ. |
| design-009 | Không | Đã xem xét: 100k sản phẩm, 50k reads/s; bảng so sánh 3 mô hình cache, code single-flight, ví dụ stale 15 phút, trade-off rõ. |
| design-010 | Không | Đã xem xét: ví dụ Full GC 38s làm sai tồn kho; bảng chọn lock, fencing token, Redlock vs etcd, trade-off rõ. |
| design-011 | Không | Đã xem xét: CAP/PACELC, bảng chọn DB theo dữ liệu (ví tiền/postgres, giỏ hàng/Redis, feed/Cassandra), ví dụ thực tế số dư stale, trade-off rõ. |
| design-012 | Không | Đã xem xét: lộ trình 1k→1M user, tín hiệu đo được, bảng tóm mốc, ví dụ thiếu index/connection pool, trade-off chi phí vận hành rõ. |
| design-013 | Không | Đã xem xét: 50k job/ngày, batch 10 triệu; ASCII diagram, SKIP LOCKED, bảng chỉ số vận hành, ví dụ connection storm, trade-off rõ. |
| architecture-001 | Không | Đã xem xét: SOLID refactor, bảng nguyên lý/dấu hiệu vi phạm, ví dụ 12 file sửa mỗi cổng, trade-off over-engineer rõ. |
| architecture-003 | Không | Đã xem xét: Strategy + Map injection, bảng cạm bẫy, ví dụ onboard kênh mới 2.5 ngày→3 giờ, trade-off switch vs Strategy rõ. |
| architecture-004 | Không | Đã xem xét: Clean/Hexagonal package, bảng so sánh layered, ví dụ ArchUnit vi phạm DIP, trade-off mapping rõ. |
| design-014 | Không | Đã xem xét: 5M giao dịch/ngày≈58 TPS, ~600 TPS cao điểm; ASCII diagram, state machine, UNKNOWN≠FAILED, ví dụ 847 giao dịch hoàn sai, trade-off rõ. |
| design-015 | Không | Đã xem xét: Snowflake 64-bit (41+10+12), ULID, DB block; bảng so sánh, clock skew, ví dụ trùng worker ID Kubernetes, trade-off rõ. |
| design-016 | Không | Đã xem xét: 500k người/5 phút, 40k ghế; ASCII diagram, conditional UPDATE, virtual waiting room, ví dụ 1.200 hold bot, trade-off rõ. |
| design-021 | Không | Đã xem xét: 2M OTP/ngày≈23/s, xác suất brute force 0,0005%; text diagram, Lua xác minh nguyên tử, ví dụ SMS pumping, trade-off SMS vs TOTP rõ. |
| architecture-009 | Không | Đã xem xét: Singleton enum/holder/DCL volatile, bảng GoF vs Spring, ví dụ config endpoint sai, trade-off global state rõ. |
| architecture-010 | Không | Đã xem xét: Simple/Factory/Abstract Factory, bảng so sánh, ví dụ Simple Factory xóa nhánh VNPay, trade-off trong Spring rõ. |
| architecture-011 | Không | Đã xem xét: Lombok @Builder bẫy (mặc định bỏ qua, JPA no-args, toBuilder nông), ví dụ status null 2% đơn, trade-off record rõ. |
| architecture-012 | Không | Đã xem xét: Proxy/CGLIB, self-invocation @Transactional, bảng tính năng proxy, ví dụ batch 10.000 lệnh rollback sai, trade-off rõ. |
| architecture-014 | Không | Đã xem xét: IoC/DI/DIP, bảng so sánh, ví dụ domain import JDBC, trade-off constructor injection rõ. |
| architecture-015 | Không | Đã xem xét: Composition over inheritance, CountingSet fragile base class, ví dụ cây tài sản, trade-off bảng rõ. |
| architecture-020 | Không | Đã xem xét: Template Method/Observer/CoR, ví dụ self-invocation REQUIRES_NEW làm trừ tiền 2 lần, trade-off bảng rõ. |
| design-029 | Không | Đã xem xét: bảng DB vs Redis Streams vs RabbitMQ/SQS vs Kafka, bảng so sánh 7 tiêu chí, ví dụ email trễ 20-40p→90s, trade-off rõ. |
| architecture-023 | Không | Đã xem xét: ADR cấu trúc MADR/Nygard, ví dụ Kafka vs RabbitMQ 3.000 events/s, bảng trade-off, pitfall ADR, trade-off rõ. |
| architecture-027 | Không | Đã xem xét: Event sourcing, snapshot mỗi 500 event p95 2,8s→150ms, schema evolution upcasting, ví dụ ví điện tử, trade-off over-engineering rõ. |
| architecture-040 | Không | Đã xem xét: 400 triệu đơn, 2.000 tenant, 16 DB, shard key/hash/range, ví dụ p99 900→260ms, bảng chiến lược sharding, trade-off rõ. |
| architecture-044 | Không | Đã xem xét: ước lượng QPS/storage/bandwidth chi tiết (100M/ngày≈1.160 QPS, peak 5.800, 4TB/ngày≈230 MB/s), bảng chuyển số thành thiết kế, trade-off headroom rõ. |
| architecture-052 | Không | Đã xem xét: REST/gRPC/messaging, 2 bảng so sánh, ví dụ checkout hybrid, pitfall cascade failure, trade-off rõ. |

Không phát hiện số liệu bịa, phép tính sai, markup lỗi, backtick/`${` trong template literal, hoặc thiếu sơ đồ/bảng/trade-off. Số mục trước/sau bằng nhau (32 câu), không xoá mục, không đổi id.
`node --check` OK; `node scripts/validate.js` → `OK — không có lỗi.` (build-light-index không cần chạy vì không thêm/sửa câu hỏi.)

Status: DONE
