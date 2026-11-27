# T2812 — 6 câu hỏi theo JD: sàn giao dịch (FIX, order book, margin) và kênh số bảo hiểm

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`

Thêm **6 câu hỏi** topic `banking` vào `js/data/q-banking.js`, bám 2 JD:
- JD Java Backend Developer (Middle–Senior) tại Sở Giao dịch Hàng hóa Việt Nam (MXV), Hà Nội: module giao dịch, khớp lệnh, quản lý tài khoản/ký quỹ (margin), nạp rút, market data real-time qua WebSocket, FIX Protocol, Kafka; tối ưu CPU/memory/GC, query, cache (Redis, Hazelcast); distributed transaction, concurrency control, deadlock, data consistency; Java 17/21, Spring Boot/Data/Security, gRPC, MongoDB, Docker, CI/CD, JProfiler/VisualVM; ưu tiên order book, risk, margin, statement, K8s.
- JD Fullstack Java Developer (Insurance/Banking domain) tại LG CNS Việt Nam, Hà Nội, 5+ năm: kênh số Web/Mobile cho bảo hiểm/ngân hàng (đăng ký online, báo giá, nộp hồ sơ hợp đồng, thanh toán, quản lý khách hàng); Java, Spring Boot, REST API, RDBMS; front-end JavaScript/HTML5/CSS + React (hoặc Vue/Angular); tích hợp Core Insurance, Payment, CRM; tuân thủ bảo mật và quy định ngành tài chính; English business level (bắt buộc), làm việc với team toàn cầu.

Câu cần có:
1. FIX Protocol cho dev Java: session layer vs application layer, Logon/Heartbeat/ResendRequest, sequence number và gap fill, NewOrderSingle → ExecutionReport; xử lý mất kết nối, trùng lệnh (ClOrdID idempotency). (senior)
2. Order book và khớp lệnh theo ưu tiên giá–thời gian: cấu trúc dữ liệu (TreeMap theo giá + hàng đợi FIFO), single-threaded matching loop, vì sao không khoá theo từng lệnh, phát market data. (senior)
3. Kiểm tra rủi ro trước giao dịch và ký quỹ (margin): initial/maintenance margin, gọi ký quỹ, cập nhật số dư khả dụng đồng thời (optimistic vs pessimistic, ledger bút toán kép). (lead)
4. Nạp/rút tiền và đối soát sao kê (statement) với ngân hàng: trạng thái giao dịch, idempotency key, đối soát cuối ngày, xử lý lệch. (senior)
5. Luồng kênh số bảo hiểm: báo giá (quotation) → nộp hồ sơ (policy application) → thanh toán phí → phát hành hợp đồng qua Core Insurance; idempotency, trạng thái, retry, anti-corruption layer khi tích hợp core cũ. (senior)
6. Bảo mật và tuân thủ cho kênh số tài chính: PII (CCCD, sức khoẻ), mã hoá at-rest/in-transit, masking log, audit trail, OWASP top lỗi hay gặp ở form đăng ký online. (mid)

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `'jd-2026-12'`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý** (nếu trùng thì chọn góc sâu hơn, ghi Notes).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ.**
- **Chỉ THÊM** vào `js/data/q-banking.js` (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau.
- Không backtick, không `${` trong template literal.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, FIX 4.4/5.0 SP2 khi nói về FIX). Không bịa tag, API, flag. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, chuẩn bị phỏng vấn đúng JD bên dưới: giải thích từ gốc, từng bước, VÌ SAO.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu (id nối tiếp từ banking-103): banking-104 (FIX protocol, senior), banking-105 (order book + market data WebSocket, senior), banking-106 (pre-trade risk + margin + optimistic/pessimistic lock + double-entry, lead), banking-107 (nạp/rút + đối soát sao kê, senior), banking-108 (luồng kênh số bảo hiểm + ACL + saga, senior), banking-109 (bảo mật/tuân thủ PII + OWASP, mid). Tất cả có `tags` chứa `'jd-2026-12'`, follow 3 câu, độ dài 5315–7872 ký tự.

Trùng ý đã có (chọn góc sâu hơn): order book ~ banking-083 (thêm TreeMap+FIFO chi tiết + WebSocket market data); margin ~ banking-086 (thêm pre-trade risk + concurrency lock + bút toán kép); đối soát ~ banking-005/024 (gắn với luồng nạp/rút + idempotency); masking ~ banking-008 (thêm mã hóa at-rest/in-transit + OWASP form).

Nghiệm thu: `node --check js/data/q-banking.js` OK; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js q-banking.js` → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T2812R)
