# T2028 — 12 câu trắc nghiệm (collections) vào quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T1712

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-java.js` (topic `collections`; id `qz-collections-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-collections-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Collections: chọn cấu trúc dữ liệu, HashMap với key mutable, ConcurrentModificationException, TreeMap với Comparator không nhất quán equals, List.of bất biến, độ phức tạp thao tác.

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

Đã thêm 12 câu trắc nghiệm collections vào js/data/quiz-java.js: qz-collections-030 → qz-collections-041 (3 câu multi: 036, 039, 041; 1/4 như yêu cầu). Chủ đề: chọn cấu trúc dữ liệu (LinkedHashMap), HashMap key mutable, ConcurrentModificationException, TreeMap comparator không nhất quán equals, List.of bất biến, độ phức tạp thao tác. Mỗi câu có explain giải thích đúng + từng sai, kết > Senior tip.

Kiểm tra: `node --check js/data/quiz-java.js` OK; `node scripts/build-light-index.js` OK (index-light.js đã sinh lại); `node scripts/validate.js`: **0 lỗi liên quan quiz-java.js**. `OK — không có lỗi.` toàn cục bị chặn bởi 5 lỗi cũ trong lessons-security.js (file không thuộc task T2028, không được sửa theo quy tắc sở hữu AGENTS.md mục 3, 5).
Reviewed-by: kilo (T2028R)
