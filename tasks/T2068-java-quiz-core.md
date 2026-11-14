# T2068 — 12 câu trắc nghiệm (core) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2043

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `core`; id `qz-core-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-core-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Java core đoán output: autoboxing và Integer cache (-128..127), String == vs equals, overload resolution với varargs/boxing, static vs instance init order, finally ghi đè return, switch expression và record equals, Optional misuse.

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
- Đã thêm 12 câu core: `qz-core-031`..`qz-core-042` (append cuối `js/data/quiz-java.js`, trước `);` đóng file). Bao gồm 3 câu `multi: true` (033, 037, 042).
- Chủ đề: Integer cache/autoboxing & unboxing, String pool/==/equals/intern và compile-time constant, overload resolution (widening/boxing/varargs), thứ tự khởi tạo static/instance/ctor, finally ghi đè return, record equals + switch expression, Optional misuse (get/orElse vs orElseGet/ofNullable/map/filter/flatMap).
- Đã chạy: `node --check js/data/quiz-java.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo sẵn có trong `path.js` về bài học không nằm trong PATH, không thuộc phạm vi task).
Reviewed-by: kilo (T2068R)
