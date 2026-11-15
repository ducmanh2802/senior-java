# T2092 — 5 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2047

Thêm **5 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống production Senior Java: API p99 tăng từ 200ms lên 3s sau deploy, memory tăng dần sau mỗi ngày, Kafka consumer lag tăng không giảm, DB connection pool cạn lúc 9h sáng, sự cố trừ tiền sai ở 0,1% giao dịch; mỗi câu đi từ triệu chứng → điều tra → khắc phục → phòng ngừa.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 5 câu (154 → 159), chèn cuối mảng bằng `node scripts/qtool.js append`:

| id | level | chủ đề | độ dài |
|---|---|---|---|
| scenario-155 | senior | p99 200ms → 3s ngay sau deploy: p50 không đổi, plan đổi sau migration (Seq Scan bỏ 3.998.213 dòng + Nested Loop lặp 400 lần do thống kê cũ) → `EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_statements`, `ANALYZE`, canary | 6286 |
| scenario-156 | senior | Memory tăng dần/ngày, heap sau Full GC vẫn 400MB → rò rỉ ngoài heap: Metaspace do parse SpEL mỗi request, `ThreadLocal` không `remove()`, thread leak; `jcmd VM.metaspace`, `-verbose:class`, `MaxMetaspaceSize` | 6537 |
| scenario-157 | senior | Kafka lag tăng không giảm, dồn vào 2 partition: poison message retry trong poll thread + key nóng; `DefaultErrorHandler` + DLQ, lag từng partition, rebalance | 7355 |
| scenario-158 | lead | Pool cạn đúng 9h, tự hết sau 6–8 phút: batch job dùng chung pool, `@Transactional` bọc cả vòng lặp + `parallelStream`; `pg_stat_activity` "idle in transaction", tách pool, `TransactionTemplate`, `idle_in_transaction_session_timeout` | 7713 |
| scenario-159 | lead | 0,1% giao dịch trừ tiền sai: trừ hai lần (thiếu idempotency) + vượt số dư (read-modify-write); unique `(account_id, request_id)` + `ON CONFLICT DO NOTHING`, `UPDATE ... WHERE balance >= ?`, `CHECK (balance >= 0)`, đối soát ledger | 7313 |

Mỗi câu có `**Tóm tắt:**` → cơ chế từng bước + VÌ SAO → code Java ≤ 30 dòng có comment → bảng trade-off → pitfall → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`, `follow` 3 câu. Không trùng với scenario-006/014/016/020/035/045/117/121/132/133/134/135 (đã đọc tóm tắt từng câu trước khi chọn góc).

Nghiệm thu:
- `node --check js/data/q-scenario.js` → OK
- `node scripts/qtool.js check js/data/q-scenario.js scenario-155 … scenario-159` → OK
- `node scripts/build-light-index.js` → `Đã ghi js/data/index-light.js (296.1 KB)`
- `node scripts/validate.js` → `scenario 159 câu hỏi`; còn 2 lỗi **của file khác, không thuộc task này**: `new-questions.js` chưa khai báo trong `js/core/data-manifest.js`, `labs-gc.js` lỗi cú pháp (agent khác đang sửa). Không sửa file ngoài phạm vi.

Không commit (đúng luật). File thay đổi: `js/data/q-scenario.js`, `js/data/index-light.js`.

Ghi chú kỹ thuật đã kiểm tra: `jcmd VM.metaspace`/`jstat -gcmetacapacity` là lệnh có thật (JDK 11+); Spring Kafka 3.x dùng `DefaultErrorHandler` (tên cũ `SeekToCurrentErrorHandler`); PostgreSQL mặc định `READ COMMITTED`; `EXPLAIN` của PostgreSQL không in dấu phân tách hàng nghìn.
Reviewed-by: kilo (T2092R)
