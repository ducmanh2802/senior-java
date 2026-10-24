# T135 — Thêm Debug lab: gc + thread

Status: TODO
Agent: opencode
Owns: `js/data/labs-gc.js`, `js/data/labs-thread.js`

Đọc AGENTS.md mục **10** và các bài có sẵn trong 2 file (không trùng kịch bản). Thêm **3 bài gc**: humongous allocation G1 (log JDK 17 unified logging -Xlog:gc*), metaspace leak do classloader (redeploy/Groovy script), container OOMKilled dù heap chưa đầy (native memory/direct buffer, MaxRAMPercentage); và **3 bài thread**: thread pool starvation do task chờ task con trong cùng pool, virtual thread pinning trong synchronized (JDK 21, jcmd Thread.dump_to_file), lock contention trên synchronized cache (nhiều thread BLOCKED cùng monitor). Artifact giống thật, tự nhất quán (thread name, lock id <0x...>, timestamp, số liệu khớp answer). `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
