# T2016 — 8 câu hỏi Senior Java (core, collections, modern) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T1700

Thêm **8 câu hỏi phỏng vấn mới** (topic: core, collections, modern) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: HashMap bên trong (resize, treeify khi va chạm, vì sao capacity lũy thừa 2), ArrayList vs LinkedList thực tế (cache locality), fail-fast iterator và ConcurrentModificationException, String.intern và string dedup của G1, BigDecimal cho tiền (scale, RoundingMode, equals vs compareTo), Comparator chain và sort ổn định, varargs/autoboxing pitfall (Integer cache -128..127), switch expression và pattern matching cho instanceof.

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
Đã thêm 8 câu hỏi vào js/data/q-java.js (id nối tiếp max của mỗi topic):
- collections-043 (lead): HashMap bên trong (resize, treeify, capacity lũy thừa 2, race resize đa luồng)
- collections-044 (senior): ArrayList vs LinkedList thực tế (cache locality, add(0) O(n))
- collections-045 (senior): fail-fast iterator, ConcurrentModificationException, modCount, xóa an toàn
- core-056 (senior): String.intern và string dedup của G1, Metaspace, rủi ro intern đầu vào
- core-057 (senior): BigDecimal cho tiền (scale, RoundingMode, equals vs compareTo, double trap)
- modern-055 (senior): Comparator chain và sort ổn định, Arrays.sort primitive không ổn định
- modern-056 (senior): varargs/autoboxing pitfall, Integer cache -128..127, equals thay ==
- modern-057 (lead): switch expression, pattern matching instanceof, sealed exhaustive, helpful NPE

Chạy node --check, node scripts/build-light-index.js, node scripts/validate.js → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T2016R)
