# T2495 — 10 câu trắc nghiệm (design) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2456

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `design`; id `qz-design-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-design-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống hệ thống nhà máy: MQTT QoS, store-and-forward khi mất mạng, time-series DB vs RDBMS, partition key theo máy, tính OEE, traceability lot/serial.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 10 câu vào `js/data/quiz.js` (file không bị mất mục nào: 294 → 304 mục), id `qz-design-081` … `qz-design-090`:

- 081 QoS 1 MQTT at-least-once, mất PUBACK → gửi lại (DUP) → dedup theo id
- 082 chọn QoS theo luồng: telemetry QoS 0, lệnh điều khiển QoS 2, số đếm QoS 1
- 083 store-and-forward: ghi bền buffer cục bộ, ring buffer giới hạn, batch replay
- 084 (multi, Chọn 2) yêu cầu bắt buộc: id ổn định + dedup cloud, ack sau khi ghi bền
- 085 2.000 cảm biến × 10 giá trị/giây trong 2 năm → time-series DB / PostgreSQL partitioning
- 086 vì sao TSDB nhanh: chunk theo thời gian, nén theo cột, tổng hợp sẵn
- 087 hot partition Kafka khi key = machine_id, cách làm key chi tiết hơn
- 088 tính OEE: A 90% × P 83,3% × Q 95% ≈ 71%
- 089 traceability lot/serial: bảng many-to-many append-only + index hai chiều
- 090 (multi, Chọn 2) bất biến + audit trail, index/partition hai chiều

Tỉ lệ multi 2/10; đáp án đơn rải đều 2 lần mỗi vị trí 0–3. Mỗi `explain` định nghĩa thuật ngữ ở lần đầu xuất hiện, có cơ chế từng bước, số liệu khớp, bảng/ASCII, ví dụ production và `> Senior tip:`.

Kiểm tra: `node --check js/data/quiz.js` OK; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` với riêng thay đổi này → `OK — không có lỗi.` (xác nhận trên bản copy HEAD + quiz.js/index-light.js của task). Trong working tree hiện tại validate còn báo lỗi của file KHÔNG thuộc task: `js/data/lessons-spring.js` (lesson-spring-024/027/028/029/030 — `{{ }}` lồng nhau, `###` thụt lề, body ngắn), do một task khác đang viết dở. Không sửa file đó.
Reviewed-by: kilo (T2495R)
