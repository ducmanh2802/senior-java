# T135 — Thêm Debug lab: gc + thread

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`, `js/data/labs-thread.js`

Ghi chú: `labs-gc.js` đã có đầy đủ 5 bài (001–005: humongous G1, listener/metaspace leak, Groovy metaspace, container native/OOMKilled dù heap thấp, allocation rate/young GC regression). `labs-thread.js` đã có đầy đủ 5 bài (001–005: deadlock AB-BA, thread pool starvation, lock contention synchronized, virtual thread pinning JDK 21, ReDoS high-CPU regex). Cả 2 file đã hoàn chỉnh từ lần trước; `node scripts/validate.js` → OK (27 debug lab: thread 5, gc 5). Không sửa thêm nội dung dữ liệu.

Đọc AGENTS.md mục **10** và các bài có sẵn trong 2 file (không trùng kịch bản). Thêm **3 bài gc**: humongous allocation G1 (log JDK 17 unified logging -Xlog:gc*), metaspace leak do classloader (redeploy/Groovy script), container OOMKilled dù heap chưa đầy (native memory/direct buffer, MaxRAMPercentage); và **3 bài thread**: thread pool starvation do task chờ task con trong cùng pool, virtual thread pinning trong synchronized (JDK 21, jcmd Thread.dump_to_file), lock contention trên synchronized cache (nhiều thread BLOCKED cùng monitor). Artifact giống thật, tự nhất quán (thread name, lock id <0x...>, timestamp, số liệu khớp answer). `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
