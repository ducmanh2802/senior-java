# T2630 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2620

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Đặt phòng khách sạn nhiều kênh (website + OTA)**: chống overbooking, giữ phòng tạm, đồng bộ tồn phòng với các OTA, huỷ và hoàn tiền. (2) **Quản lý kho và giao hàng chặng cuối**: tồn kho nhiều kho, giữ hàng khi đặt, phân tuyến shipper, theo dõi trạng thái đơn realtime.

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
- Đã thêm 2 đề system design mới nối tiếp sd-046:
  - **sd-047** "Đặt phòng khách sạn đa kênh (website + OTA)" (level senior, kind bigtech): chống overbooking bằng atomic UPDATE WHERE available >= qty, hold TTL + job thu hồi, đồng bộ ARI sang OTA (push qua outbox/Kafka + đối soát pull định kỳ), webhook OTA idempotent, state machine HOLD/CONFIRMED/CANCELLED/REFUNDED, hoàn tiền idempotent. ref ~8.7k ký tự, 5 phases, 10 rubric, 4 followups, seq diagram hợp lệ.
  - **sd-048** "Quản lý kho và giao hàng chặng cuối (last-mile)" (level lead, kind bigtech): tồn nhiều kho (available/reserved), reserve atomic 2-phase + commit/nhả idempotent, allocation chọn kho gần nhất + split shipment, route planning theo lô 30-60s (TSP xấp xỉ, không realtime từng đơn), tracking realtime event append-only + fan-out WebSocket/SSE, đồng bộ tồn/kiểm kê, xử lý hoàn hàng. ref ~9.3k ký tự, 5 phases, 10 rubric, 4 followups, seq diagram hợp lệ.
- Đã sửa 1 lỗi có sẵn trong file: dấu phẩy thừa tạo lỗ hổng mảng (sparse hole) giữa sd-044 và sd-045 (HEAD không có, phát sinh trong working tree). Sau sửa: window.SD_PROBLEMS có 48 phần tử, không còn lỗ hổng.
- Kiểm tra cô lập (vm + Diagram.parseSeq + quét backtick/${/brace/fence/field lạ/độ dài) cho sd-047, sd-048: 0 lỗi. `node --check js/data/sd-problems.js` OK.
- `node scripts/validate.js`: sd-problems.js KHÔNG còn lỗi. Các LỖI còn lại đều thuộc file của task khác đang chạy song song (labs-sql.js T2631, lessons-api.js T2645, bugs.js, path.js hệ quả từ lessons-api hỏng), và index-light.js bị báo cũ vì build-light-index.js crash ngay trên lessons-api.js:4489 (template literal có backtick) — không phải lỗi của file này.
- KHÔNG chạy được `node scripts/build-light-index.js` tới khi lessons-api.js được task khác sửa; integrator cần chạy lại build-light-index.js sau khi merge để cập nhật index-light.js. Đã KHÔNG commit theo luật.
Reviewed-by: kilo (T2630R)
