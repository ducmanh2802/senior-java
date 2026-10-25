# T148 — Từ điển thuật ngữ: Java, JVM, concurrency, Spring, JPA

Status: DONE
Agent: opencode
Owns: `js/data/glossary-java.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html), AGENTS.md mục 5 (markup) và 13 (refs). Người đọc: dev Java junior người Việt, chưa từng nghe thuật ngữ này. Thêm **~35 entry** vào `glossary-java.js`: happens-before, volatile, CAS (compare-and-swap), race condition, deadlock, thread pool, virtual thread, pinning, carrier thread, garbage collector, stop-the-world pause, heap/young/old generation, metaspace, JIT, escape analysis, bean, dependency injection, IoC container, proxy (JDK/CGLIB), AOP, self-invocation, transaction propagation, persistence context, dirty checking, lazy loading, N+1 query, optimistic locking, pessimistic locking, entity state (transient/managed/detached), connection pool, immutable object, functional interface, checked exception, generics type erasure.

Mỗi entry: `short` 1 câu dễ hiểu không dùng thuật ngữ khác; `body` 800–2000 ký tự gồm **### Ví dụ đời thường** (so sánh với đời sống: ngân hàng, quán cà phê, giao hàng…), **### Cơ chế** (từng bước), một sơ đồ ASCII trong `~~~text` (sequence giữa client/server/DB hoặc hộp-mũi-tên), **### Khi nào dùng**, **### Hay nhầm với** (so sánh với thuật ngữ gần nghĩa). `aliases`: viết thường, gồm biến thể số nhiều/viết tắt hay gặp trong đáp án (grep `js/data/q-*.js` để lấy đúng cách viết đang dùng). `related`: id entry khác (trong file này hoặc 2 file glossary còn lại nếu chắc chắn có). `refs` 1–3: ưu tiên tài liệu chính thức và video hội thảo/kênh uy tín; **chỉ link chắc chắn tồn tại** — chạy `node scripts/check-links.mjs js/data/glossary-java.js` nếu script đã hỗ trợ glossary, không thì tự kiểm tra; không chắc thì bỏ refs. Không backtick, không `${`. `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 35 entry vào `js/data/glossary-java.js` (đúng danh sách trong task), body 1337–1756 ký tự, đủ 4 mục bắt buộc + sơ đồ `~~~text`.
- 151 alias (viết thường, có biến thể số nhiều/viết tắt: `gc`, `stw`, `cas`, `jit`, `aop`, `ioc`, `n+1`, `requires_new`, `cglib`…). Đã loại alias quá rộng gây link sai (`propagation`, `transient` trần).
- `related` chỉ trỏ tới id có thật trong file này (2 file glossary còn lại chưa có entry). `refs` 1–2 mỗi entry, toàn link chính thức; `node scripts/check-links.mjs glossary-java.js` → 36 link, 0 hỏng.
- `node scripts/validate.js` → `OK — không có lỗi.` Không sửa file nào ngoài `js/data/glossary-java.js` và file task này.
Reviewed-by: opencode (T148R)
