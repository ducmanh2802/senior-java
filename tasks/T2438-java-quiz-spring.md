# T2438 — 10 câu trắc nghiệm (spring) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2421

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Spring: @Transactional không chạy (self-invocation, private method, checked exception), proxy, bean scope, @Async, auto-config.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 10 câu trắc nghiệm topic spring vào js/data/quiz.js (chỉ thêm, không sửa mục cũ):
qz-spring-913 (self-invocation @Transactional), qz-spring-914 (@Transactional trên private method),
qz-spring-915 (bắt exception nuốt trong method @Transactional), qz-spring-916 (@Transactional trên method final/CGLIB),
qz-spring-917 (prototype inject vào singleton), qz-spring-918 (@Async gọi this bypass proxy),
qz-spring-919 (@ConditionalOnMissingBean / auto-config bị bỏ qua), qz-spring-920 (multi: propagation REQUIRES_NEW),
qz-spring-921 (multi: @Async exception handler + SimpleAsyncTaskExecutor mặc định),
qz-spring-922 (@Transactional(readOnly = true) với Hibernate/JPA).

verify: `node --check js/data/quiz.js` OK; `node scripts/build-light-index.js` OK (sinh lại index-light.js);
`node scripts/validate.js` không báo lỗi về quiz.js. Các lỗi còn lại của validate.js nằm ở lessons-spring.js (file không sở hữu, do các task khác/integrator).
Reviewed-by: kilo (T2438R)
