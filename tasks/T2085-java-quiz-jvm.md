# T2085 — 12 câu trắc nghiệm (jvm) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2077

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `jvm`; id `qz-jvm-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-jvm-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống JVM: chọn GC (G1/ZGC) theo latency, đọc GC log JDK 17, OOM Metaspace vs heap vs direct memory, container memory limit và MaxRAMPercentage, JIT warm-up, heap dump phân tích.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
Đã thêm 12 câu trắc nghiệm JVM (`qz-jvm-046` đến `qz-jvm-057`) vào `js/data/quiz.js` (id nối tiếp `qz-jvm-045`): chọn GC (G1/ZGC) theo latency, đọc GC log JDK 17, OOM Metaspace vs heap vs direct memory, container memory limit và MaxRAMPercentage, JIT warm-up, heap dump phân tích. 3 câu `multi: true` (qz-jvm-052, 054, 057), 9 câu đơn; đáp án đúng rải đều vị trí; `explain` giải thích đúng và sai từng phương án; không backtick/`${`; đúng Java 17.

`node --check js/data/quiz.js` → OK. `validate.js` không báo lỗi nào thuộc `quiz.js`/`qz-jvm-*`. Chạy toàn bộ báo lỗi trước do file KHÔNG thuộc task T2085 (q-banking.js lỗi cú pháp `integration_idem` chặn `build-light-index` → index-light.js cũ; new-questions.js chưa khai báo manifest; lỗi liên quan banking cascading) — theo AGENTS.md mục 3 không sửa file của task khác.

## Notes
qz-jvm-046, 047, 048, 049, 050, 051, 052, 053, 054, 055, 056, 057 (12 câu).Reviewed-by: kilo (T2085R)
