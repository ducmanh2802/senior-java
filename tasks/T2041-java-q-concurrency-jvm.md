# T2041 — 6 câu hỏi Senior Java (jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2017

Thêm **6 câu hỏi phỏng vấn mới** (topic: jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: class loading và ClassLoader leak khi redeploy, JIT deoptimization và megamorphic call, escape analysis và scalar replacement đo bằng JMH, JMH benchmark đúng cách (warmup, Blackhole, dead code), Native memory tracking (NMT) để tìm rò rỉ ngoài heap, GraalVM native image trade-off cho Spring Boot.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added 6 JVM questions: `jvm-059` (senior, ClassLoader leak khi redeploy: cơ chế, nguồn leak, MAT/NMT điều tra, cleanup), `jvm-060` (senior, JIT deoptimization và call site megamorphic: speculation, uncommon trap, inline cache, JFR), `jvm-061` (senior, escape analysis & scalar replacement đo bằng JMH: no/arg/global escape, -prof gc, đối chứng -XX:-DoEscapeAnalysis), `jvm-062` (senior, JMH đúng cách: warmup/fork/Blackhole/@State/@Param, chống DCE/constant folding, đọc score+error), `jvm-063` (senior, NMT khoanh vùng RSS ngoài heap: baseline/diff, hạng mục Thread/Class/Internal, glibc arena/JNI), `jvm-064` (lead, GraalVM native image trade-off cho Spring Boot 3.x: closed-world AOT vs JIT, startup/footprint vs throughput đỉnh, reachability metadata/PGO, tiêu chí chọn).
- JVM count in file: 58 -> 64. Verified: `node --check js/data/q-concurrency-jvm.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` -> `OK — không có lỗi.` (pre-existing warnings unchanged).
- No other files modified. No git commit/push. No browsers/process kills/npm install.
Reviewed-by: kilo (T2041R)
