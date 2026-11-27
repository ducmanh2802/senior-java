# T2788 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2773

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Nền tảng form/khảo sát trực tuyến 1 triệu lượt trả lời mỗi ngày**: form động, chống spam, xuất báo cáo, webhook. (2) **Log tập trung cho 200 service**: thu thập, lưu nóng/lạnh, tìm kiếm, cảnh báo, chi phí lưu 30 ngày.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
- Vòng 3: hai chủ đề đã có sẵn 2 vòng trước (form: sd-049, sd-063; log: sd-050, sd-064). Chọn góc CHƯA có:
  - **sd-065** (form, lead): "Nền tảng khảo sát với phân tích kết quả thời gian thực và logic nhánh (1 triệu lượt/ngày)". Góc mới = **đọc để phân tích** (pre-aggregate counter, HyperLogLog đếm người duy nhất, cross-tab, funnel drop-off theo trang, mẫu số theo logic nhánh, đối soát stream vs batch). Khác sd-049 (chống spam/export/webhook) và sd-063 (versioning/partial save/file upload).
  - **sd-066** (log, lead): "Log tập trung 200 service với lấy mẫu theo đuôi (tail-based sampling) để giảm chi phí mà không bỏ sót lỗi". Góc mới = **tail-based sampling** (buffer theo traceId, quyết định cuối trace, giữ 100% ERROR/chậm, cold 100% Parquet, alert đặt trước sampler). Khác sd-050 (hot/cold/cost) và sd-064 (ILM/alert engine/backpressure).
- Chỉ THÊM 2 mục (id sd-065, sd-066 nối tiếp sd-064), không sửa mục cũ. Đã đọc kỹ schema và độ sâu các đề sẵn có.
- Kiểm tra: `node --check js/data/sd-problems.js` OK; `node scripts/build-light-index.js` đã sinh lại index; `node scripts/validate.js` KHÔNG báo lỗi nào từ sd-problems.js/sd-065/sd-066 và không báo index cũ. 2 sơ đồ ~~~seq mới parse OK bằng js/core/diagram.js.
- LƯU Ý: `node scripts/validate.js` hiện còn LỖI ở các file KHÁC (q-security.js, quiz-ops.js, lessons-modern.js, lessons-jpa.js, lessons-banking.js, lessons-payments.js) — đây là lỗi có sẵn từ task khác chưa tích hợp, KHÔNG thuộc quyền sở hữu của T2788 nên tôi không sửa (theo luật 3 AGENTS.md). Khi integrator gộp đủ các task và chạy validate, các lỗi này sẽ được chủ sở hữu tương ứng xử lý; phần của T2788 đã sạch.
Reviewed-by: kilo (T2788R)
