# T2651 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2641

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Nền tảng form/khảo sát trực tuyến 1 triệu lượt trả lời mỗi ngày**: form động, chống spam, xuất báo cáo, webhook. (2) **Log tập trung cho 200 service**: thu thập, lưu nóng/lạnh, tìm kiếm, cảnh báo, chi phí lưu 30 ngày.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 đề mới vào cuối `js/data/sd-problems.js` (sd-001..sd-048 đã có, không sửa mục cũ; tổng 48 -> 50 đề):
  - **sd-049** — "Nền tảng form và khảo sát trực tuyến (form động, chống spam, xuất báo cáo, webhook)" (kind bigtech, senior). Có đủ phases 5 bước, rubric 10 ý, seq diagram (Respondent→CDN→Ingest→Kafka→DB→Webhook), schema JSON versioned, chống spam nhiều lớp, outbox+retry+HMAC cho webhook, export async streaming ra S3. related: design-028, design-067, design-070.
  - **sd-050** — "Log tập trung cho 200 service (thu thập, lưu nóng/lạnh, tìm kiếm, cảnh báo, chi phí 30 ngày)" (kind bigtech, senior). DaemonSet agent → Kafka đệm → processor che PII → hot store (OpenSearch/Loki 7 ngày) + cold Parquet S3 30 ngày; chỉ index dữ liệu nóng để kiểm soát chi phí; log-based alerting theo tỉ lệ lỗi; cardinality; seq diagram 6 actor. related: design-019, design-069, design-070.
- góc khác với câu đã có: sd-019 (log+metrics 1000 pod) là câu hỏi tự luận, sd-050 là đề system design 200 service tập trung vào hot/cold tiering + chi phí index 30 ngày + alerting; sd-028/067 (async export job, notification webhook) là câu hỏi, sd-049 là đề form/khảo sát đầy đủ vòng đời + chống spam.
- Kiểm tra: `node --check js/data/sd-problems.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js sd-problems.js` -> OK; `node scripts/validate.js` (full) -> OK — không có lỗi. Không backtick, không `${` trong nội dung. Không commit.
Reviewed-by: kilo (T2651R)
