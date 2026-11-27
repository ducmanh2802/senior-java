# T2775 — 10 câu trắc nghiệm (core) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2743

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `core`; id `qz-core-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-core-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: equals/hashCode contract, String immutability, autoboxing và Integer cache (== giữa Integer), checked/unchecked exception, try-with-resources, generics erasure và PECS, final/static, pass-by-value. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-core đã có.

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
Đã thêm 10 câu qz-core-065 đến qz-core-074 (nối tiếp qz-core-064 là id lớn nhất trong quiz-java.js):
- qz-core-065: equals/hashCode — mutate key trong HashMap gây lost entry
- qz-core-066: String immutability — StringBuilder vs + trong vòng lặp, GC pressure
- qz-core-067: autoboxing — Integer unboxing trong biểu thức toán học, không NPE khi non-null
- qz-core-068 (multi): checked/unchecked exception + try-with-resources suppressed exception
- qz-core-069: try-with-resources — exception chính từ try block, close() suppressed
- qz-core-070: generics erasure/PECS — List invariant, cần ? extends cho producer, ? super cho consumer
- qz-core-071 (multi): final/static — final reference vs mutable object, static final constant folding, static không truy cập instance
- qz-core-072: pass-by-value — reassign parameter không ảnh hưởng caller, chỉ mutate mới ảnh hưởng
- qz-core-073 (multi): autoboxing/cache — Integer cache -128..127, Long cache không bắt buộc, Double không cache, unboxing null NPE
- qz-core-074: generics type inference — intersection type (Serializable & Comparable<?>) khi truyền String và int
Tất cả validation pass, syntax check pass.
Reviewed-by: kilo (T2775R)
