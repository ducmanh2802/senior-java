# T820 — 2 debug lab thread: virtual thread pinning và common pool starvation

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab hiện có trong `js/data/labs-thread.js` (đang có 8 lab) để không trùng tình huống. Artifact phải giống THẬT và tự nhất quán (tên thread, lock id, timestamp, số liệu khớp nhau và khớp answer). id tiếp nối số lớn nhất. Thêm 2 lab level senior:
1. Chuyển sang **virtual threads (Java 21)** nhưng throughput không tăng: pinning do synchronized bao quanh lời gọi JDBC/IO; artifact: thread dump (jcmd Thread.dump_to_file dạng text), log -Djdk.tracePinnedThreads=full, số liệu trước/sau.
2. **ForkJoinPool.commonPool starvation**: parallelStream + CompletableFuture.supplyAsync không truyền executor gọi IO chặn; artifact: jstack với các thread ForkJoinPool.commonPool-worker đều chờ ở socket read, số CPU, latency tăng.

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
- Đã thêm 2 lab mới (chèn trước `);` cuối file, không sửa/xoá lab cũ):
  - `lab-thread-009` (senior): virtual thread pinning do `synchronized` bao quanh JDBC/IO (Spring Boot 3.3, Java 21). Artifacts: `metrics-before-after.txt`, `trace-pinned.log` (`-Djdk.tracePinnedThreads=full`, `onPinned`, `monitors:1` tại `CustomerRepository.findById:37`/`CustomerLookupService.lookup:29`), `vt-dump.txt` (`jcmd Thread.dump_to_file -format=text`, 2 carrier `worker-1/2` carrying #812/#819 locked `0x000000070f2a1c40`/`0x000000070f2a4e10`, 214 virtual WAITING). Bằng chứng/triệu chứng khớp: 2 vCPU=2 carrier, Hikari pending=0, p99 95ms→640ms, throughput 820→790 req/s, CPU 40%.
  - `lab-thread-010` (senior): `ForkJoinPool.commonPool` starvation — `parallelStream()` + `CompletableFuture.supplyAsync()` không truyền executor gọi HTTP blocking. Artifacts: `metrics-14h.txt` (parallelism=7, 260 req/s, p99 420ms→18s, CPU 11%, upstream p99<250ms), `jstack-pricing.txt` (7 `commonPool-worker-*` đều RUNNABLE @ `Net.poll/Socket.read` tới tax/inventory, `CompletableFuture$AsyncSupply` + `AbstractTask.compute`), `PricingService.java`. Có sơ đồ `~~~seq` (≥3 bên).
- Kiểm tra: `grep -c "id: '" js/data/labs-thread.js` trước=8, sau=10 (đúng +2). `node --check js/data/labs-thread.js` OK. `node scripts/build-light-index.js` OK. `node scripts/validate.js` → `Debug lab: 46 bài (thread 10, ...)`, `OK — không có lỗi.` (cảnh báo cũ không đổi).
- Không có `refs` (không chắc link chính thức cụ thể cho case tổng hợp). Không commit, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T820R)
