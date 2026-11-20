# T2509R — Fact-check nội dung mới của T2509

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2509 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 4 câu mới (microservices-116…119, +354 dòng) trong `js/data/q-microservices.js`. Sửa 3 lỗi kiến thức, không đổi văn phong/bố cục/không thêm-bớt mục (file chỉ sửa tại chỗ, không đổi số mục):

- **microservices-116** — (1) Sơ đồ zombie write ghi sai nguồn của fencing token ("SET lock … -> token=1/2" như thể Redis tự phát số), trong khi `SET NX` chỉ trả OK/nil; đã nói rõ token phải đến từ nguồn đơn điệu (INCR trên Redis, sequence DB, hoặc version/revision của tài nguyên). Phần còn lại đúng: NX/PX, watchdog `lockWatchdogTimeout/3` (30s → gia hạn 10s, TTL về 30s), Lua so token rồi DEL, Redlock/Kleppmann, bảng trade-off.
- **microservices-117** — Sơ đồ TIME_WAIT đặt sai bên giữ cổng: B gửi FIN trước ("B chủ động đóng") nhưng TIME_WAIT lại vẽ ở phía client. Theo TCP, TIME_WAIT thuộc bên chủ động đóng; đã sửa thành client gửi FIN → server ACK → client vào TIME_WAIT 60s (khớp với "Cơ chế từng bước" và với lỗi cạn ephemeral port ở phía client). Các số khác kiểm tra lại đều đúng: dải cổng 32768-60999 = 28.232; 800 req/s × 60s = 48.000 → cạn sau ~35s; TLS handshake 1-2 RTT; `ss`/`sysctl`/`tcpdump` hợp lệ.
- **microservices-119** — Sửa 2 chỗ số liệu tự mâu thuẫn: ví dụ số cụ thể có 4 pod × pool 200 = 800 kết nối nhưng ghi `max_connections 500` (sẽ bị từ chối "too many clients" chứ không phải chậm dần) → đổi thành 1.000; ví dụ đời thực có 6 pod × 200 = 1.200 kết nối nhưng `max_connections 1.000` → đổi thành 2.000 (vẫn giữ chi tiết "900 kết nối active"). Định luật Little (2.000 qps × 6 ms = 12), pool mặc định HikariCP 10, `max_connections` PostgreSQL mặc định 100, các metric `pg_stat_activity`/`pg_stat_statements`/`hikaricp.connections.pending` đều đúng.
- **microservices-118** — Không có lỗi kiến thức (single-thread Redis 6+ I/O đa luồng, KEYS O(n) chặn client, SCAN có thể trả trùng, 5 eviction policy, hot key/big key, singleflight, slowlog/`--latency`). Giữ nguyên.

Nghiệm thu:
- `node --check js/data/q-microservices.js` → OK.
- `node scripts/validate.js q-microservices.js` → `OK — không có lỗi.` (microservices = 119 câu, không có lỗi/cảnh báo nào thuộc file này).
- `node scripts/validate.js` (toàn bộ) vẫn báo lỗi ở **file không thuộc task này**, không sửa theo luật 3: `q-sql-extra.txt` (file lạ không khai báo trong data-manifest), `q-frontend.js` (5 câu topic "frontend" chưa có trong topics.js — task T2499 đang làm), `lessons-microservices.js` (lesson-microservices-026 `~~~seq` 8 actors — task lessons-microservices đang làm). Sau khi các task đó xong, chạy lại `node scripts/validate.js` sẽ `OK`.
