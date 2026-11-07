# T635 — 2 bài học database vận hành: connection pool và deadlock

Status: DONE
Agent: qoder
Owns: `js/data/lessons-db.js`

Track **db** đã có isolation level, lost update, optimistic locking, B-tree index (đọc để không trùng). Thêm 2 bài, order tiếp nối, bài tập Java thuần, test xác định (deterministic):
1. **Connection pool hoạt động thế nào (kiểu HikariCP)**: vì sao mở connection đắt, pool size nhỏ thường nhanh hơn, connectionTimeout, leak detection, vì sao gọi HTTP bên ngoài khi đang giữ connection làm cạn pool; công thức tham khảo của PostgreSQL wiki (cores * 2 + spindles) chỉ là điểm bắt đầu. Bài tập: `MiniPool(size, timeoutMs, Clock)` với `borrow()` / `release(c)`, ném lỗi khi hết hạn chờ, phát hiện connection bị giữ quá ngưỡng (leak); dùng Semaphore; ≥ 6 case.
2. **Deadlock trong database**: hai giao dịch chuyển tiền ngược chiều khoá 2 dòng theo thứ tự khác nhau, wait-for graph, database tự phát hiện và huỷ một giao dịch (PostgreSQL báo deadlock detected, SQLSTATE 40P01), cách phòng: khoá theo thứ tự cố định (id nhỏ trước), giao dịch ngắn, retry. Bài tập: `WaitForGraph` với `addWait(tx, holder)`, `findCycle()` trả chu trình, `victim()` chọn giao dịch trẻ nhất; và `TransferLocks.order(a, b)`; ≥ 6 case.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-db.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

Đã thêm 2 bài vào cuối `js/data/lessons-db.js` (chỉ chèn trước `);`, không sửa 5 bài cũ — `git diff --numstat` = 448 thêm / 0 xóa):

- `lesson-db-006` (order 6, senior, 30 phút) — "Bên trong connection pool: borrow, timeout khi chờ và phát hiện leak". Body: chi phí mở một connection (TCP/TLS/SCRAM/process backend), mô hình slot + Semaphore + hàng đợi FIFO, bảng phân biệt connectionTimeout / socketTimeout / statement_timeout / lock_timeout / idle_in_transaction_session_timeout, vì sao pool nhỏ thường nhanh hơn + công thức khởi điểm `cores * 2 + spindles`, Little's Law, leak detection (leakDetectionThreshold + stack trace), idleTimeout/maxLifetime (kèm mốc AWS NLB 350 s). Sơ đồ `~~~seq` 4 actor (Req A / Pool / Req B / PostgreSQL). Bài tập `MiniPool(size, timeoutMs, Clock)` + `Conn` nested: `borrow()` dùng `tryAcquire(timeoutMs, MILLISECONDS)` và ném `IllegalStateException` khi hết hạn chờ, `release()` chống double-release (không nhân đôi permit), `leased()`, `leakedOver(thresholdMs)` đếm theo `clock.millis()` → **10 test case**, có 1 case concurrency (ExecutorService + CountDownLatch + Future.get để lộ exception, assert leased ≤ size).
- `lesson-db-007` (order 7, senior, 30 phút) — "Deadlock: hai giao dịch khoá ngược chiều và cách database phá vòng chờ". Body: row lock + 2PL, kịch bản chuyển tiền A→B và B→A (SQL hai cột + `~~~seq` 3 actor + wait-for graph ASCII), phát hiện chu trình sau `deadlock_timeout` (mặc định 1000 ms) → `deadlock detected` / SQLSTATE `40P01`, MySQL 1213 + SHOW ENGINE INNODB STATUS, Oracle ORA-00060, SQL Server 1205; quy tắc chọn victim thật của từng DB (PG: ít việc nhất, MySQL: undo nhỏ nhất) và nói rõ luật "trẻ nhất" trong bài tập chỉ là quy ước xác định; 7 cách phòng + bảng phân biệt blocking/deadlock/starvation/lost update. Bài tập `WaitForGraph` (`addWait`, `findCycle` DFS theo thứ tự chèn + xoay chu trình về tx lâu đời nhất, `victim` = tx trẻ nhất trong chu trình) và `TransferLocks.order(a, b)` → **11 test case**.

Gate đã chạy: `node scripts/test-lessons.js` → 133/133 OK (riêng 2 bài mới: 10/10 và 11/11, starter biên dịch được và không pass hết); `node scripts/build-light-index.js` → đã ghi lại `index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Chống ghi đè: số bài trong file trước = 5, sau = 7 (thêm đúng 2); `git diff --numstat js/data/lessons-db.js` = `448 0` (không dòng nào bị xóa/sửa). Lưu ý `grep -c "id: '"` chỉ ra 3 vì các bài 004/005 (và 006/007 của task này) viết gọn `id:'` không dấu cách — dùng `grep -c "id: '\|id:'"` để đếm đủ.

Đề xuất cho integrator (không tự sửa vì nằm ngoài quyền sở hữu của task này):
- Thêm `lesson-db-006`, `lesson-db-007` vào `lessons` của `path-08` trong `js/data/path.js`. Hiện `validate.js` chỉ cảnh báo: "có 12 bài học không nằm trong PATH", trong đó có 2 id mới này.
- `lesson-db-004` (task khác, đã có trong file) cũng dạy connection pool nhưng ở mức chính sách (capacity, max_connections, Little's Law, bài tập `TinyPool` không timeout). `lesson-db-006` đi sâu cơ chế borrow/timeout/leak nên không trùng bài tập; nếu muốn gọn track, cân nhắc nối 004 → 006 thành cặp "chiến lược" + "bên trong" hoặc chuyển 004 thành phần đọc thêm.
- Có thể thêm `related` từ `lesson-db-007` tới các câu hỏi db về locking nếu integrator muốn liên kết (task này không dùng `related` để tránh phụ thuộc id chưa kiểm chứng).
Reviewed-by: kilo (T635R)
