# T2587 — 10 câu trắc nghiệm (modern) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2581

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `modern`; id `qz-modern-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-modern-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: record, sealed class, pattern matching instanceof/switch (Java 21), text block, var, Stream API (Collectors, teeing, toList bất biến), Optional dùng đúng/sai, virtual threads cơ bản. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-modern đã có.

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
Đã thêm 10 câu trắc nghiệm modern (qz-modern-051 đến qz-modern-060) vào js/data/quiz-java.js:
- qz-modern-051: Record component mutable (List) không tự defensive copy
- qz-modern-052: Sealed interface + pattern matching switch exhaustive (multi)
- qz-modern-053: Pattern matching switch với generic type erasure và guard pattern
- qz-modern-054: Text block độ dài tính incidental indentation và newline
- qz-modern-055: var dùng ở đâu (local + initializer, enhanced for, try-with-resources) (multi)
- qz-modern-056: Collectors.teeing với filtering chẵn/lẻ
- qz-modern-057: Stream.toList() vs Collectors.toList() vs toUnmodifiableList() behavior
- qz-modern-058: Optional orElse vs orElseGet, ifPresent, map+orElseThrow, isPresent+get anti-pattern (multi)
- qz-modern-059: Virtual thread pinning do synchronized quanh JDBC blocking I/O
- qz-modern-060: Virtual thread best practices: không pool, startVirtualThread, giới hạn tại tài nguyên (multi)

Validation: node --check js/data/quiz-java.js OK; node scripts/validate.js: chỉ còn lỗi pre-existing ở file khác (quiz-gaps.js, lessons-design.js, lessons-jvm.js, path.js) không thuộc sở hữu.
Reviewed-by: kilo (T2587R)
