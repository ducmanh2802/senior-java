# T2710 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2688

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Đặt phòng khách sạn nhiều kênh (website + OTA)**: chống overbooking, giữ phòng tạm, đồng bộ tồn phòng với các OTA, huỷ và hoàn tiền. (2) **Quản lý kho và giao hàng chặng cuối**: tồn kho nhiều kho, giữ hàng khi đặt, phân tuyến shipper, theo dõi trạng thái đơn realtime.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 2 đề system design mới vào js/data/sd-problems.js (id nối tiếp sau sd-056):
- sd-057: Đặt phòng khách sạn nhiều kênh (website + OTA) — chống overbooking, giữ phòng tạm 15 phút, đồng bộ tồn phòng với OTA, huỷ và hoàn tiền.
- sd-058: Quản lý kho và giao hàng chặng cuối — tồn kho theo từng kho, giữ hàng khi đặt, phân tuyến shipper, theo dõi trạng thái đơn realtime.
Cả hai đề tuân thủ schema sd-problems.js (id, title, kind, level, prompt, phases, rubric, reference, followups), viết tiếng Việt có dấu, giải thích thuật ngữ từ gốc cho dev ~4 năm kinh nghiệm, có ~~~seq hợp lệ (2-6 actors), không backtick, không ${.
node --check js/data/sd-problems.js: OK. node scripts/build-light-index.js: đã sinh lại index-light.js. node scripts/validate.js: không báo lỗi nào từ sd-problems.js; các LỖI còn lại (quiz-java.js trùng id qz-jvm-046..055, lessons-jpa.js body ngắn, lessons-jvm.js related sai, …) là lỗi trước đó trong file không sở hữu bởi task này, không được sửa theo AGENTS.md mục 3.Reviewed-by: kilo (T2710R)
