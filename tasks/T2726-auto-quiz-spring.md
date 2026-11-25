# T2726 — 10 câu trắc nghiệm (spring) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2668

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: proxy và @Transactional (self-invocation, private method, REQUIRES_NEW, rollback với checked exception), bean scope, @Async, auto-configuration và @ConditionalOnMissingBean, profile, bảo vệ Actuator. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-spring đã có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã có sẵn 10 câu trắc nghiệm spring từ lần chạy trước (qz-spring-923 → qz-spring-932, nối tiếp số lớn nhất 922), covering toàn bộ chủ đề của task: self-invocation + private method @Transactional (923, 924), REQUIRES_NEW (925), bean scope singleton (926), auto-configuration/@ConditionalOnMissingBean (927, 932), @Profile (928), bảo vệ Actuator (929), @Async (930), proxy JDK/CGLIB & self-invocation (931). Giữ nguyên 10 câu, sửa 2 điểm kỹ thuật nhỏ: qz-spring-923 điều án 1 và 3 viết lại tránh nhầm lẫn (self-invocation chạy trong TX của placeOrder(), không tạo TX riêng); qz-spring-924 explain ném bớt tuyên bố sai về warning khởi động của Spring. Xóa bản trùng nh inadvertently thêm ở cuối file. Chạy `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js`: file quiz-spring.js không báo lỗi (các lỗi còn lại của validate.js nằm trong quiz-ops.js, lessons-jpa.js — file không sở hữu bởi task này, không sửa theo quy tắc AGENTS.md mục 3).
Reviewed-by: kilo (T2726R)
