# T2772 — 3 câu hỏi Senior Java (core) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2734

Thêm **3 câu hỏi phỏng vấn mới** (topic: core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý**.

Chủ đề: String immutability và string pool trong thực tế (intern, String deduplication của G1), xử lý exception ở tầng service: checked vs unchecked, wrap và giữ cause, generic wildcard (PECS) với ví dụ API thật.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
- Đã thêm 3 câu (id nối tiếp, max cũ core-085): **core-086** (senior) String immutability góc BẢO MẬT: secret không xoá được khỏi heap + intern giữ lâu → dùng char[]/KeyStore; chiều tốt chặn TOCTOU. **core-087** (senior) @Transactional mặc định rollback unchecked + 3 bẫy production (nuốt lỗi → commit; lồng nhau → UnexpectedRollbackException; checked không rollback) + rollbackFor/giữ cause. **core-088** (lead) PECS thiết kế API generic thật (Result<T>, event bus) + variance functional interface + wildcard capture + giới hạn erasure.
- Góc đã chọn khác vòng trước (core-083/084/085): bảo mật String (chưa có), transaction+exception (khác translation 084), PECS ở mức lead thiết kế (khác 085 cơ bản).
- Kiểm tra: `node --check` OK; `build-light-index.js` chạy lại; `validate.js` không còn lỗi thuộc q-java.js (các LỖI còn lại đều ở file khác: quiz-ops.js, lessons-*, path.js — không thuộc task này). KHÔNG commit.
Reviewed-by: kilo (T2772R)
