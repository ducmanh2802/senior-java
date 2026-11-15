# T2093 — 12 câu trắc nghiệm (spring) vào quiz.js

Status: DONE
Notes: Đã thêm 12 câu trắc nghiệm (id qz-spring-054 đến qz-spring-065). Validation báo lỗi file khác, không phải do task này.
Agent: kilo
Owns: `js/data/quiz.js`
After: T2085

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Spring Boot/JPA: proxy và @Transactional, propagation, lazy loading ngoài transaction, bean scope, @Async, cấu hình datasource/HikariCP.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2093R)
