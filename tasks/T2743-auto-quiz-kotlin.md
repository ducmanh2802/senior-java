# T2743 — 10 câu trắc nghiệm (kotlin) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2632

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `kotlin`; id `qz-kotlin-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-kotlin-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: null safety, data class, extension function, scope function (let/apply/also/run), sealed class + when, coroutines suspend/launch/async, gọi qua lại với Java (@JvmStatic, @JvmOverloads). Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-kotlin đã có.

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
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm kotlin vào js/data/quiz-java.js: qz-kotlin-031 đến qz-kotlin-040 (nối tiếp qz-kotlin-030, là số lớn nhất của topic trong mọi file quiz; ids 021-030 giữ nguyên, không làm mất mục của người khác).
Góc chưa có so với vòng 021-030: kiểu platform từ Java (031), copy() shallow copy với MutableList (032), extension function static dispatch & thành viên ưu tiên (033), scope function sâu hơn (034, multi), sealed class + when thêm subtype gây lỗi biên dịch (035), coroutineScope hủy anh em khi con lỗi (036), launch/async/join ném exception (037, multi), @JvmStatic (038), hàm cấp cao nhất/@JvmField/kiểu platform (039, multi), lateinit (040).
3 câu multi: true (034, 037, 039), đáp án rải đều vị trí, q ghi "(Chọn 2)" khớp answer.length.
Validate: `node --check js/data/quiz-java.js` OK; `node scripts/validate.js quiz-java.js` không lỗi quiz-java.js.
Chặn: `node scripts/build-light-index.js` và `node scripts/validate.js` (tất cả file) bị chặn bởi lỗi cú pháp đã có sẵn trong js/data/q-soft.js (dòng 10838, template literal chưa đóng, nội dung testing do agent khác thêm nhưng chưa commit, không phải file sở hữu của task này). Theo luật 3 AGENTS.md không sửa q-soft.js. Khi q-soft.js được sửa, chạy build-light-index.js rồi validate.js → OK cho phần kotlin.
Reviewed-by: kilo (T2743R)
