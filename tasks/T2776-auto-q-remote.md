# T2776 — 3 câu hỏi Senior Java (remote) vào undefined

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js` (task ghi `undefined` do placeholder chưa điền; topic `remote` thuộc `q-remote.js` theo topics.js)
After: T2712

Thêm **3 câu hỏi phỏng vấn mới** (topic: remote) vào `js/data/undefined`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/undefined`); đọc danh sách để **không trùng ý**.

Chủ đề: làm remote cho công ty nước ngoài: viết design doc bất đồng bộ để team khác múi giờ review, báo cáo tiến độ khi bị chặn bởi team khác, xử lý sự cố production lúc 2 giờ sáng giờ Việt Nam khi on-call.

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
`node --check js/data/undefined`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- File sở hữu thực tế: `js/data/q-remote.js` (placeholder `undefined` trong đề bài chưa được điền; topic `remote` map tới `q-remote.js` trong `js/data/topics.js`).
- Đã thêm 3 câu (id nối tiếp remote-066 → remote-067/068/069), đọc list trước để không trùng:
  - `remote-067` (senior): viết design doc async cho team khác múi giờ review — cấu trúc doc, review request, giới hạn 2 vòng, gom góp ý, chốt bằng ADR. Góc khác remote-023 (vốn chỉ nói design doc ở mức tổng quan): đi sâu quy trình vòng review async + ADR + seq diagram.
  - `remote-068` (senior): bị chặn bởi team khác (cross-team dependency) — báo cáo tiến độ/impact, workaround (mock/stub/feature flag), escalate đúng cách. Khác remote-023 (blocked bởi 1 người/quyết định): đây là dependency liên team + escalation.
  - `remote-069` (lead): on-call xử lý sự cố production lúc 2 giờ sáng giờ VN khi team chính ngủ — SEV, mitigate trước/điều tra sau, jstack/GC log, giao tiếp async, handoff. Hoàn toàn mới.
- Mỗi câu đủ `**Tóm tắt:**` → cơ chế từng bước → code/~~~seq → bảng trade-off → pitfall → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu` (150–220 từ) → `> Senior tip:`; follow 3 câu; tiếng Việt có dấu; không backtick/`${`.
- `node --check js/data/q-remote.js` OK; `node scripts/qtool.js check js/data/q-remote.js remote-067 remote-068 remote-069` → OK (23 lỗi còn lại thuộc file khác: quiz-ops.js, lessons-*.js — không sở hữu, không sửa theo luật 3).
- `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` không in OK vì lỗi tồn đọng ở file của agent khác (không phải file này). Không commit.
