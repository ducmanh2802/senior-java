# T2892 — 10 câu trắc nghiệm (core) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2868

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `core`; id `qz-core-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-core-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: equals/hashCode contract, String immutability, autoboxing và Integer cache (== giữa Integer), checked/unchecked exception, try-with-resources, generics erasure và PECS, final/static, pass-by-value. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-core đã có.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm core: qz-core-075 đến qz-core-084.
- qz-core-075 (multi): HashMap key mutation sau put → hashCode thay đổi mất entry
- qz-core-076: StringBuilder.toString() vs intern() so sánh reference
- qz-core-077 (multi): Integer/Long cache phạm vi, Double/Float không cache
- qz-core-078: catch subclass sau superclass không bao giờ chạy
- qz-core-079: try-with-resources suppressed exception thứ tự ngược khai báo
- qz-core-080 (multi): wildcard capture List<?> add(null) OK, add(get(0)) lỗi, generic method OK
- qz-core-081: static initialization order (superclass trước) + instance initializer
- qz-core-082: pass-by-value với int[] (sửa nội dung được, gán lại tham số không ảnh hưởng) và Integer immutable
- qz-core-083 (multi): final field semantics bảo vệ reference, không bảo vệ mutable state bên trong array
- qz-core-084: String += trong vòng lặp O(n²) tạo rác vs StringBuilder O(n)
Reviewed-by: kilo (T2892R)
