# T857 — 2 debug lab thread: logging chặn toàn app và pool lồng nhau

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T820

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab hiện có trong `js/data/labs-thread.js` (đang có 10 lab) để không trùng tình huống. Artifact phải giống THẬT và tự nhất quán (tên thread, lock id, timestamp, số liệu khớp nhau và khớp answer). id tiếp nối số lớn nhất. Thêm 2 lab level senior:
1. **Appender log đồng bộ chặn mọi thread** khi đĩa chậm/đầy: jstack nhiều thread BLOCKED trên lock của appender Logback, df/iostat; cách sửa (AsyncAppender, neverBlock, discardingThreshold).
2. **Thread pool deadlock do task chờ task con cùng pool**: pool cố định 8 thread, task cha submit task con rồi get(); jstack 8 thread WAITING ở FutureTask.get, hàng đợi đầy.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/labs-thread.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. answer 2500–5000 ký tự.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/labs-thread.js`.

## Nghiệm thu
`node --check js/data/labs-thread.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id lab mới vào Notes.

## Notes
- Đã thêm 2 lab senior vào `js/data/labs-thread.js` (chỉ chèn trước `);` cuối, không sửa object cũ):
  - `lab-thread-011` (senior): **Log đồng bộ chặn toàn bộ request khi ổ đĩa chậm và đầy** — `RollingFileAppender` đồng bộ, 1 thread (`http-nio-8080-exec-12`, TID 4988) giữ monitor `<0x0000000712c04a10>` kẹt ở `FileOutputStream.writeBytes` do `/dev/vdb` 100% (`await ~1s`, `%util 100%`); 193/200 thread Tomcat `BLOCKED` chờ cùng lock tại `OutputStreamAppender.subAppend:238`. Artifact tự nhất quán (lock id, TID/nid, timestamp 09:19:10, iostat/df khớp). Đề xuất `AsyncAppender` + `neverBlock=true`/`discardingThreshold`/`queueSize`, `totalSizeCap`, stdout+shipper, đánh đổi mất log.
  - `lab-thread-012` (senior): **Thread pool chết đứng vì task cha chờ task con trên cùng pool cố định 8 thread** — 8 thread `reconcile-pool-1..8` (pool 8) đều `WAITING` ở `FutureTask.get` (`aggregatePartition ReconcileService.java:72` ← `run$0:48`) chờ `FutureTask` con; `activeCount=8`, `completedTask=0`, `queue.size=137` (task con nằm hàng đợi, không thread rảnh). Thread-starvation deadlock, JVM không báo "Found one Java-level deadlock" (không vòng monitor). Sửa: tách pool cha/con, bỏ lồng, `get(timeout)`, queue giới hạn+reject, metric/alert.
- Kiểm chứng: `grep -c "id:" js/data/labs-thread.js` trước 10, sau 12 (+2). `node --check js/data/labs-thread.js` OK. `node scripts/build-light-index.js` OK (Debug lab thread 12). `node scripts/validate.js` vẫn báo 3 LỖI thuộc `js/data/q-security.js` (security-036, inline code `{{ {bcrypt}...}}`/`{{ {argon2id}...}}` chứa `{}` lồng nhau) — **file ngoài phạm vi sở hữu của task này, không sửa**; `labs-thread.js` không phát sinh lỗi/cảnh báo mới.
Reviewed-by: kilo (T857R)
