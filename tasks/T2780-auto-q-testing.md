# T2780 — 3 câu hỏi Senior Java (testing) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2735

Thêm **3 câu hỏi phỏng vấn mới** (topic: testing) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chiến lược test cho hệ thống chuyển tiền (unit, integration, contract, E2E: tỉ lệ và thứ tự), test idempotency và retry với WireMock giả lỗi, mutation testing (PIT) có đáng chạy không và đọc kết quả thế nào.

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
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- 3 câu đã thêm (id nối tiếp max cũ của topic testing): **testing-066** (senior, 4774 ký tự — chiến lược test chuyển tiền: kim tự tháp, tỉ lệ 70/20/5/5, thứ tự unit→integration/contract→E2E), **testing-067** (senior, 5231 — test idempotency + retry bằng WireMock scenario 503→timeout→200, backoff+jitter, partial failure), **testing-068** (lead, 4866 — mutation testing PIT: cơ chế mutant, mutation score, killed/survived/equivalent, khi nào đáng chạy).
- Lần chạy trước bị gián đoạn để lại 3 câu này ở bản rút gọn (~1300–1500 ký tự); đã đọc lại, giữ cấu trúc tốt và mở rộng đủ chuẩn mục 6 (giải thích thuật ngữ, cơ chế từng bước, code ~~~java/~~~xml, bảng trade-off, pitfall, ví dụ số liệu, trả lời mẫu 150–220 từ, Senior tip). Không có lỗi cú pháp; không backtick/`${` trong template literal.
- `node --check js/data/q-soft.js` OK; `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js`: **không còn lỗi/cảnh báo nào thuộc q-soft.js** (testing-066/067/068 không còn nằm trong danh sách đáp án ngắn). Các LỖI còn lại đều ở file KHÔNG thuộc task này (quiz-ops.js, lessons-jpa.js, lessons-payments.js, lessons-modern.js) — ngoài phạm vi sở hữu, không tự sửa theo luật 3 AGENTS.md.
- Không commit.
Reviewed-by: kilo (T2780R)
