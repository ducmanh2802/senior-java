# T2738 — 10 câu trắc nghiệm (scenario) vào quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2715

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-design.js` (topic `scenario`; id `qz-scenario-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-scenario-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống production: API chậm đột ngột, pool connection cạn, consumer Kafka lag tăng, OOM sau deploy, cache stampede, retry storm — chọn bước điều tra/ xử lý đúng đầu tiên. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-scenario đã có.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu hỏi mới: qz-scenario-031 đến qz-scenario-040.
- 031: Virtual thread pinning trong synchronized (carrier thread exhaustion)
- 032: Database deadlock do lock ordering (multi-select)
- 033: G1GC allocation rate cao gây Full GC spike, tuning G1/ZGC
- 034: Metaspace OOM do classloader leak (JDBC driver, ThreadLocal)
- 035: Kafka rebalance storm do max.poll.interval.ms violation + heartbeat thread block (multi-select)
- 036: Reactive service dùng blocking JDBC trong boundedElastic cạn HikariCP pool
- 037: Cache stampede dù có lock Redis do exception không release lock (thiếu finally/Lua script)
- 038: CircuitBreaker không mở cho slow call, cần slow call rate + TimeLimiter (multi-select)
- 039: Tomcat thread pool cạn do blocking S3 upload, giải pháp presigned URL / WebFlux / virtual thread
- 040: Flyway/Liquibase migration race condition trên K8s initContainer, dùng Kubernetes Job
3 câu multi-select: 032, 035, 038.
Tất cả câu hỏi mới không trùng lặp với 30 câu scenario đã có (001-030).
Validation: OK — không có lỗi.
Reviewed-by: kilo (T2738R)
