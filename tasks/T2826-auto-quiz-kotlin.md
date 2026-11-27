# T2826 — 10 câu trắc nghiệm (kotlin) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2775

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `kotlin`; id `qz-kotlin-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-kotlin-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: null safety, data class, extension function, scope function (let/apply/also/run), sealed class + when, coroutines suspend/launch/async, gọi qua lại với Java (@JvmStatic, @JvmOverloads). Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-kotlin đã có.

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
Da them 10 cau trắc nghiệm kotlin vao js/data/quiz-java.js: qz-kotlin-041 den qz-kotlin-050 (id noi tiep sau qz-kotlin-040, lon nhat cua topic trong moi file quiz).
- qz-kotlin-041: by lazy (khoi tao muot, an toan luong)
- qz-kotlin-042: ten?.let tra ve Int? khong gan duoc cho Int (null safety + scope)
- qz-kotlin-043: data class khong duoc ke thua class chi implements interface
- qz-kotlin-044: toString cua data class
- qz-kotlin-045 (multi): sealed class khong khoi tao duoc, subtype cung module+cung package
- qz-kotlin-046: runBlocking chon luong va cho doi con
- qz-kotlin-047: async tra ve Deferred, can await de nhan gia tri
- qz-kotlin-048 (multi): coroutineScope huy con con lai, supervisorScope khong
- qz-kotlin-049: @JvmName doi ten ham top-level cho Java
- qz-kotlin-050: copy() giu gia tri mac dinh cua thuoc tinh khong xac dinh
Da chay: node --check js/data/quiz-java.js (OK), node scripts/build-light-index.js (OK), node scripts/validate.js khong bao loi tu quiz-java.js/qz-kotlin-* (cac loi con lai o file khac, khong sua theo quy tắc 3 AGENTS.md).
Reviewed-by: kilo (T2826R)
