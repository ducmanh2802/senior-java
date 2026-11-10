# T1381R — Fact-check nội dung mới của T1381

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1381 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật/markup trong các section "Ví dụ đời thực" mới của T1381:

1. **concurrency-040** (ConcurrentHashMap resize): Sửa ví dụ đời thực — dung lượng khởi tạo `new ConcurrentHashMap<>(65536)` chỉ cho ~98k entry (load factor 0.75), không đủ cho 500k. Đã sửa thành `new ConcurrentHashMap<>(700000)` để constructor nội bộ tableSizeFor ra 1.048.576 ô (đủ cho 500k/0.75 ≈ 667k). Cũng bổ sung các bước resize trung gian thiếu (262144 → 524288 → 1048576) cho chính xác. Sửa markup: `{{ConcurrentHashMap<String, Route>>>}}` → `{{ConcurrentHashMap<String, Route>}}` (bỏ `>>>` thừa).

2. **concurrency-041** (StampedLock optimistic read): Sửa markup `{{ConcurrentHashMap<String, Route>>>}}` → `{{ConcurrentHashMap<String, Route>}}` (bỏ `>>>` thừa).

Không phát hiện lỗi kiến thức (API/flag/cơ chế/số liệu) trong các section mới còn lại (concurrency-042, 043, 044). Các ví dụ đời thực về CompletableFuture event-loop blocking, reordering x86 vs ARM/Graviton, virtual thread pinning với JDBC driver đều chính xác kỹ thuật.

Lưu ý: `node scripts/validate.js` báo lỗi ở file khác (q-system-design.js, q-remote.js, lessons-db.js, projects.js, path.js) — đây là lỗi có sẵn trước, không liên quan đến file q-concurrency-jvm.js mà task này sở hữu.
