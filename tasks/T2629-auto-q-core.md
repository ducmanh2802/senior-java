# T2629 — 3 câu hỏi Senior Java (core) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2471

Thêm **3 câu hỏi phỏng vấn mới** (topic: core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý**.

Chủ đề: String immutability và string pool trong thực tế (intern, String deduplication của G1), xử lý exception ở tầng service: checked vs unchecked, wrap và giữ cause, generic wildcard (PECS) với ví dụ API thật.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu core vào js/data/q-java.js (id nối tiếp core-079): core-080 (senior) string pool intern → khóa sai String literal gây chặn chéo; core-081 (senior) exception tầng service gọi nhiều hệ thống downstream (checked/unchecked, wrap giữ causa, fail-fast/fallback); core-082 (lead) generic wildcard PECS viết API thực tế + bẫy capture of ?.
q-java.js: node --check OK; node scripts/validate.js q-java.js → 0 lỗi.
Không chạy được node scripts/build-light-index.js và validate.js toàn cục đến OK vì js/data/labs-sql.js (task T2631, agent khác, không thuộc quyền sở hữu T2629) chứa lỗi cú pháp backtick trong nội dung template literal làm crash vm.runInContext; theo AGENTS.md mục 3 không sửa file của người khác. Khi labs-sql.js khôi phục, cần chạy lại build-light-index.js rồi validate.js để làm mới index-light.js.Reviewed-by: kilo (T2629R)
