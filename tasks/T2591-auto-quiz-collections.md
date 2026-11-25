# T2591 — 10 câu trắc nghiệm (collections) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2587

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `collections`; id `qz-collections-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-collections-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: HashMap (resize, treeify, key mutable), ConcurrentHashMap (computeIfAbsent, không cho null), ArrayList vs LinkedList thực tế, TreeMap/NavigableMap, List.of bất biến, fail-fast iterator, PriorityQueue. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-collections đã có.

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
- Đã thêm 10 câu vào `js/data/quiz-java.js` (chèn sau `qz-collections-041`, trước `qz-concurrency-034`): `qz-collections-042` … `qz-collections-051`.
- Chủ đề (góc khác các câu 007–041 đã có): 042 NavigableMap floor/ceiling/higher/lower; 043 HashMap spread `h^(h>>>16)` + capacity luỹ thừa 2; 044 ConcurrentHashMap recursive computeIfAbsent → IllegalStateException; 045 CopyOnWriteArrayList snapshot iterator (multi); 046 PriorityQueue min-heap peek/poll; 047 Map.copyOf cấm null; 048 CHM bulk ops forEach/search/reduce + parallelismThreshold; 049 ArrayList vs LinkedList bộ nhớ/cache (multi); 050 TreeMap headMap là view gắn liền; 051 EnumSet/EnumMap (multi).
- 3/10 câu `multi: true` (Chọn 2), đáp án rải đều (single: 2,0,3,1,2,0,1; multi: [0,1],[2,3],[1,3]); explain nêu vì sao đúng + vì sao từng phương án sai; không backtick, không `${`.
- `node --check js/data/quiz-java.js` → OK. Kiểm tra schema 10 mục mới bằng script riêng → ALL_OK.
- **Blocker ngoài phạm vi**: `node scripts/validate.js` và `build-light-index.js` hiện dừng ở `js/data/q-devops.js` (lỗi cú pháp `Unexpected identifier 'kubectl'`, file của task khác đang sửa dở trong working tree; bản HEAD của file này OK). Theo AGENTS.md luật 3, KHÔNG tự sửa file người khác. 139 lỗi validate đều bắt nguồn từ q-devops.js (câu devops không nạp được → path.js trỏ thiếu + index-light cũ); **không có lỗi nào thuộc quiz-java.js**. Khi q-devops.js được hoàn tất, chạy lại `node scripts/build-light-index.js && node scripts/validate.js` sẽ OK.
Reviewed-by: kilo (T2591R)
