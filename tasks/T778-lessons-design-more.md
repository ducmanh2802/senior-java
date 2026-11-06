# T778 — 2 bài system design mô phỏng: outbox và sharding

Status: DONE
Agent: qoder
Owns: `js/data/lessons-design.js`

Track **design** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Transactional outbox: vì sao không gửi Kafka trong transaction DB**: dual-write, outbox table, relay polling/CDC, đảm bảo at-least-once + consumer idempotent, thứ tự theo aggregate. Bài tập: mô phỏng DB + broker trong bộ nhớ có thể "sập" giữa chừng; chứng minh cách dual-write mất message còn outbox thì không.
2. **Sharding: chọn shard key, hot partition, resharding**: hash vs range, tenant lớn làm lệch tải, scatter-gather query, đổi số shard. Bài tập: `ShardRouter` hash/range, đo độ lệch tải với dữ liệu lệch cho sẵn, và tính số key phải di chuyển khi tăng 4 → 6 shard.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-design.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

- **Id đã thêm** (tiếp nối order lớn nhất trước đó = 5): `lesson-design-006` (order 6, Transactional outbox, senior) và `lesson-design-007` (order 7, Sharding: shard key / hot partition / resharding, senior). Chỉ chèn object mới trước `);` cuối file, không sửa 5 bài cũ.
- **Cảnh báo ghi đè**: file dùng helper `lesson(id, order, ...)` nên metric đếm id là số dòng `lesson('` (trước = 5, sau = 7, khớp), không phải `grep -c "id: '"` (dòng `id:` chỉ xuất hiện 1 lần trong helper).
- **Cả hai chủ đề đều chưa có trong track design** nên không phải đổi đề tài: 001 rate limiter, 002 cache eviction, 003 consistent hashing, 004 circuit breaker, 005 idempotency/retry. 006 tham chiếu lại 005 (idempotent consumer) và 007 tham chiếu 003 (consistent hashing) thay vì lặp nội dung.
- **Bài tập 006**: `Sim` (DB có transaction + broker ngoài transaction + 3 điểm crash `commit`/`publish`/`mark`) định nghĩa sẵn trong harness; người học viết `Outbox.dualWrite / writeWithOutbox / relay / consume`. 7 case: đường nhanh, dual-write mất event vĩnh viễn, outbox nguyên tử với dòng đơn hàng, relay giữ dòng pending, relay đúng một lần khi ack về, mất ack → duplicate thật (at-least-once), consumer khử trùng.
- **Bài tập 007**: `Router.hashShard / rangeShard / counts / movedKeys / imbalance`, 9 case. Số liệu **đo thật bằng JDK**, không bịa: 1200 key `user-0..1199` chia 4 shard = [298, 300, 302, 300] (imbalance 0,013), tăng 4 → 6 shard làm **802 key (66,8%)** đổi chỗ, `hashShard("user-0", 4) = 2`, tenant lệch 900/100 chia hash trên 8 shard → 124–126 key/shard (imbalance 0,016).
- **Sơ đồ `~~~seq`**: mỗi bài một sơ đồ 5 hệ thống (outbox: Service/MySQL/Relay/Kafka/Consumer; resharding: App/Router/Shard cũ/Shard mới/Migration job) — validator parse OK.
- **Cổng đã chạy**: `node scripts/test-lessons.js lesson-design-006` → 7/7; `... lesson-design-007` → 9/9; `node scripts/test-lessons.js` (full, kèm điều kiện starter biên dịch được và KHÔNG pass hết) → 179/179; `node scripts/build-light-index.js` → 137.1 KB; `node scripts/validate.js` → **OK — không có lỗi** (design: 7 bài).
- **Đề xuất cho integrator**: thêm `lesson-design-006`, `lesson-design-007` vào `lessons` của một stage trong `js/data/path.js` (validate đang cảnh báo "14 bài học không nằm trong PATH", trong đó có 2 bài này). Không tự sửa path.js vì không thuộc quyền sở hữu của task.
- **File rác cần xoá trước khi commit**: `tmp-calc.js` và `scripts/t778-calc.js` (script tính số liệu phân phối hash tạm thời, không thuộc task, không được commit). Agent không được phép chạy `rm` trong môi trường này nên để lại cho người tích hợp.
- Không chạy build/probe UI (luật 9); render chỉ được kiểm qua validator + `node --check` ngầm định khi sandbox load file.
Reviewed-by: kilo (T778R)
