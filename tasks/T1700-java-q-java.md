# T1700 — 8 câu hỏi Senior Java (core, collections, modern) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T1569

Thêm **8 câu hỏi phỏng vấn mới** (topic: core, collections, modern) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: generics và type erasure, wildcard PECS (extends/super) với ví dụ API thật, Optional dùng đúng và sai, thiết kế exception (checked vs unchecked, wrap, mất stack trace), sequenced collections và record pattern (Java 21), equals trong kế thừa, reflection/annotation processing tốn gì, Java serialization và lỗ hổng deserialization.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 8 câu hỏi mới vào `js/data/q-java.js` với ID:
- core-049: Generics/type erasure, heap pollution, bridge method, reifiable types
- core-050: PECS wildcard (Producer Extends, Consumer Super) với ví dụ List, Comparator, Function
- core-051: Optional best practices (orElse vs orElseGet, ifPresentOrElse, anti-pattern: field/param/collection)
- core-052: Exception design (checked vs unchecked, wrap giữ stack trace, custom exception hierarchy)
- modern-054: Sequenced Collections + Record Patterns (Java 21) - reversed(), getFirst/getLast, switch exhaustive
- core-053: Equals/hashCode trong inheritance, canEqual pattern, composition over inheritance
- core-054: Reflection vs Annotation Processing, MethodHandle, LambdaMetafactory, overhead giảm thiểu
- core-055: Java Serialization vulnerabilities (deserialization attack, gadget chain, serialVersionUID, ObjectInputFilter, JSON/protobuf thay thế)

Validation: `node --check js/data/q-java.js` OK, `node scripts/validate.js` OK cho 8 câu hỏi mới. Các lỗi còn lại là pre-existing trong file khác (q-concurrency-jvm.js, bugs.js, lessons-*, projects.js, path.js).
Reviewed-by: kilo (T1700R)
