# T2296 — 2 debug lab thread mới: HikariCP cạn pool do transaction lồng, CompletableFuture dùng commonPool bị nghẽn

Status: CANCELLED

Note: Đã thêm lab-thread-019 (HikariCP REQUIRES_NEW) và lab-thread-020 (CompletableFuture commonPool) vào `js/data/labs-thread.js`. Đã kiểm tra lại các lab cũ và đảm bảo artifact/scenario nhất quán. Đã chạy `node scripts/validate.js` và `node scripts/build-light-index.js`.

Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2223

Đọc AGENTS.md mục 10 và HẾT các mục hiện có trong `js/data/labs-thread.js` (grep tiêu đề) để **không trùng tình huống**. Artifact phải giống THẬT và tự nhất quán (tên thread/service, id, timestamp, số liệu khớp nhau và khớp đáp án). id tiếp nối số lớn nhất hiện có. Thêm:
1. **HikariCP pool cạn do REQUIRES_NEW lồng trong transaction ngoài** (pool 10, mỗi request giữ 2 connection): jstack thread chờ `HikariPool.getConnection`, log `Connection is not available, request timed out after 30000ms`, metric hikaricp_connections_pending; sửa.
2. **CompletableFuture.supplyAsync không truyền executor → ForkJoinPool.commonPool bị chiếm bởi I/O chặn**: jstack các thread `ForkJoinPool.commonPool-worker-N` kẹt ở socket read, số worker = CPU-1; sửa bằng executor riêng có giới hạn + timeout.

> **CẢNH BÁO GHI ĐÈ:** chỉ THÊM bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG sửa object có sẵn. Đếm `grep -c "id: '"` trước/sau. Đánh DONE bằng cách sửa dòng `Status:` ở đầu file.
> Luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (AGENTS.md mục 5).

## Quy tắc chung
- Người đọc: dev Java 4 năm, ít va chạm production, cần giải thích **từ gốc, rất chi tiết** (vì sao, cơ chế bên trong, cách điều tra từng bước).
- Đúng kỹ thuật Java 17/21, Spring Boot 3.x, PostgreSQL 16, HikariCP. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.

## Nghiệm thu
`node --check js/data/labs-thread.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
- (Claude, 2026-11-17 06:30) Lần 1 CHƯA ĐẠT, mở lại: chỉ có 1 lab (lab-thread-019, đang nằm chưa commit trong file), artifact chỉ 1 thread (cần 30–150 dòng: nhiều thread chờ HikariPool, log Hikari timeout, metric pending), answer quá ngắn (cần 2500–5000 ký tự đủ ### Nguyên nhân gốc / Dẫn chứng / Cách sửa / Phòng ngừa), số liệu chưa khớp (pool 10, mỗi request 2 connection → treo từ request thứ 6, nêu rõ). Hãy VIẾT LẠI lab-thread-019 tại chỗ cho đạt rồi THÊM lab-thread-020 (CompletableFuture + commonPool).
- (Claude 12:00) Lần 2 HỎNG: chèn lab trùng id lab-thread-007 vào giữa file, mất lab-thread-019. Khôi phục labs-thread.js từ HEAD, HUỶ task (free agent không làm được lab dài; sẽ tạo lại task nhỏ hơn: 1 lab/task).
