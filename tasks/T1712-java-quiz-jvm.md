# T1712 — 12 câu trắc nghiệm (jvm) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T1486

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `jvm`; id `qz-jvm-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-jvm-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống JVM: đọc GC log, chọn GC, OOM loại nào, JIT/warm-up, class loading, flag bộ nhớ trong container (MaxRAMPercentage).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã kiểm tra id cuối trước khi thêm: `qz-jvm-033` (trong `quiz-java.js` và toàn bộ `quiz*.js`).
- Đã thêm 12 câu: `qz-jvm-034`..`qz-jvm-045` vào cuối `js/data/quiz-java.js` (chèn trước `);` đóng mảng).
- Chủ đề bao phủ: MaxRAMPercentage/container memory (034), JIT warm-up (035), OOM heap space + heap dump/cache eviction (036, multi), đọc GC log G1 Young evacuation (037), chọn G1GC vs ZGC latency (038), Metaspace OOM/ClassLoader leak (039, multi), class loading & parent delegation (040), Initial/Max/Min RAMPercentage cố định heap (041), OOM unable to create native thread (042, multi), Parallel GC vs throughput cho batch (043), bytecode/.class & verification (044), container OOMKilled exit 137 native memory (045). Có 3 câu `multi: true` (036, 039, 042).
- Đã chạy: `node --check js/data/quiz-java.js` (OK), `node scripts/build-light-index.js` (OK), `node scripts/validate.js` (vẫn còn lỗi pre-existing ngoài scope: `labs-sql.js` lỗi cú pháp/chạy; `lessons-sql.js` lesson-sql-010.body inline code `{{}}`/EXPLAIN). Không sửa file ngoài quyền sở hữu.
Reviewed-by: kilo (T1712R)
