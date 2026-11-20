# T2521 — 6 câu hỏi Senior Java (behavioral) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2493

Thêm **6 câu hỏi phỏng vấn mới** (topic: behavioral) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Level lead. Người học là dev ~4 năm, CHƯA có chức danh lead chính thức (chỉ lead không chính thức: kèm junior, phụ trách module, xử lý sự cố) — mỗi câu phải có mục "### Nếu bạn chưa từng làm lead chính thức" chỉ cách kể kinh nghiệm lead không chính thức một cách trung thực. Mỗi câu: ### Interviewer muốn nghe gì (tín hiệu lead) → khung trả lời STAR → ### Trả lời mẫu khi phỏng vấn (150–220 từ, có số liệu) → ### Câu trả lời yếu thường gặp (vì sao bị đánh giá thấp) → follow 2–3 câu đào sâu. Chủ đề KHÔNG trùng các câu đã có (bất đồng, tech debt, migration, phỏng vấn ứng viên, xung đột 2 senior, sự cố production): (1) estimate và lập kế hoạch sprint khi yêu cầu chưa rõ, deadline bị ép; (2) xử lý một thành viên làm việc kém/chậm (1:1, kế hoạch cải thiện, khi nào báo lên quản lý); (3) giao việc (delegation): vì sao lead tự code hết là sai, chọn việc cho junior thế nào; (4) xây văn hoá code review và coding convention cho team mới; (5) onboarding người mới để 2 tuần commit được; (6) 90 ngày đầu khi nhận team/dự án mới.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Nội dung T2521 (6 câu hỏi behavioral, topic: behavioral, chủ đề: (1) estimate/lập kế hoạch sprint khi yêu cầu mơ hồ + deadline ép, (2) xử lý thành viên làm việc kém/chậm: 1:1, PIP, khi nào báo quản lý, (3) delegation — lead không tự code hết, chọn việc cho junior, (4) xây văn hoá code review + coding convention, (5) onboarding 2 tuần commit được, (6) 90 ngày đầu nhận team/dự án mới) ĐÃ TỒN TẠI trong `js/data/q-soft.js` dưới id `behavioral-064`..`behavioral-069` (6 câu, level lead/senior, format đầy đủ: tín hiệu lead → STAR → câu trả lời mẫu → câu trả lời yếu → follow 2–3 câu, có mục "Nếu bạn chưa từng làm lead chính thức").
- Áp dụng luật anti-trùng ý (AGENTS.md §6 + Luật T2521): KHÔNG thêm câu trùng lặp, không tiến id (max vẫn là behavioral-069).
- Kiểm tra: `node --check js/data/q-soft.js` → OK. `validate.js` không báo lỗi nào về `q-soft.js`/`behavioral-*`.
- Chưa đạt "OK — không có lỗi" từ `node scripts/validate.js`/`build-light-index.js` do lỗi đã có sẵn trong các file KHÔNG thuộc quyền sở nhiệm T2521: `q-sql-extra.txt` (chưa khai báo manifest), lỗi cú pháp `q-concurrency-jvm.js`, `q-spring-data.js`, `q-microservices.js`, `q-system-design.js`, `q-frontend.js` (topic "frontend" chưa có trong topics.js), `bugs.js`/`lessons-*.js`/`projects.js`/`path.js` (related-id sai), `index-light.js` cũ (build crash do `q-microservices.js`). Theo AGENTS.md quy tắc 3, task T2521 không sửa file này; ghi chặn để người tích hợp xử lý.
- Không git commit (luật AGENTS.md #4).
Reviewed-by: kilo (T2521R)
