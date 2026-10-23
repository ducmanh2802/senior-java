# T114 — Câu hỏi đào sâu Java core / JVM / concurrency (mức Senior–Lead)

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`, `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (đặt đúng topic theo file — xem `js/data/topics.js`; nếu tên file thật khác thì dùng file chứa topic `core`/`jvm`/`concurrency` và ghi vào Notes). Đọc mọi `q:` có sẵn để không trùng. Thêm **~5 câu mỗi topic** kiểu phỏng vấn ngân hàng/big tech hay hỏi xoáy: JMM happens-before với ví dụ thật, false sharing và @Contended, virtual threads pinning (Java 21) và cách phát hiện (-Djdk.tracePinnedThreads, JFR), ZGC generational vs G1 khi nào chọn, escape analysis/JIT tiers, String dedup/compact strings, ForkJoinPool common pool bẫy trong parallel stream/CompletableFuture, StructuredTaskScope (preview — ghi rõ), equals/hashCode với JPA entity, record/sealed trong domain model. Có `refs` nếu chắc link (mục 13). `node scripts/validate.js` + `node scripts/check-links.mjs <file>` → OK.

## Notes
Đã bổ sung 5 câu core, 2 câu concurrency và 3 câu JVM theo các góc đào sâu còn thiếu; các ý task đã có sẵn được giữ nguyên để tránh lặp. File thực tế đúng như topic registry. `node --check` cả hai file và `node scripts/validate.js` đều OK. `check-links.mjs` chạy trên hai file, báo Links: 0.
