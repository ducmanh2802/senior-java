# T2818 — Pet project: quản lý rủi ro real-time và market data liên thông sàn quốc tế

Status: DONE
Agent: kilo
Owns: `js/data/projects.js`
After: T2817

Thêm dự án `proj-deriv-risk` (level senior, 8 tuần). Đọc 2 dự án `proj-commodity-exchange`, `proj-clearing-margin` và **nối tiếp**.

Bối cảnh: người học là dev Java 5 năm (Spring Boot, tối ưu query, review code), muốn vào sàn giao dịch **phái sinh hàng hoá** (kiểu Sở Giao dịch Hàng hóa Việt Nam – MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD mục tiêu: module giao dịch, khớp lệnh, tài khoản/ký quỹ, nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, tối ưu GC/CPU/query/cache (Redis, Hazelcast), distributed transaction, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Dự án phải giúp họ **kể được trong phỏng vấn** và **chạy được trên laptop** (Docker Compose).

Phạm vi: nhận giá tham chiếu từ "sàn quốc tế" giả lập (feed tick qua WebSocket/Kafka, có trễ và mất gói), chuẩn hoá và **conflation** cho 50.000 client, kiểm tra rủi ro real-time (position limit, giới hạn tín dụng, lãi lỗ tạm tính theo tick), **circuit breaker** và tạm ngừng giao dịch khi giá vượt biên độ, cache vị thế bằng Redis hoặc Hazelcast (so sánh, nhất quán với DB), cảnh báo, dashboard rủi ro, chuyển tháng đáo hạn (rollover) và ngày giao dịch cuối, quan sát hệ thống (metrics p99, consumer lag, GC pause).

## Cách viết
- **Đọc kỹ dự án mẫu `proj-wallet`** (đầu `js/data/projects.js`) và giữ **đúng schema + độ sâu**: `id, title, level, weeks, skills, business{intro, journeys[{title,persona,steps}], diagrams[{title,caption,actors,steps}], glossary[{term,meaning}]}, pitch, requirements, architecture, design, milestones[{title,tasks,done,guide}], challenges, readme, interview{story, questions, answers}, related`.
- `business` giải thích nghiệp vụ phái sinh **cho người chưa biết gì về tài chính**: ví dụ có số (1 hợp đồng ngô CBOT = 5.000 bushel, bước giá, ký quỹ ban đầu, lãi lỗ theo ngày…); số liệu sàn thật chỉ ghi khi chắc chắn, kèm "(tham khảo, kiểm tra contract spec của sàn)". glossary ≥ 12 thuật ngữ (futures, contract month, tick size, initial/maintenance margin, mark-to-market, variation margin, open interest, position limit, settlement price, margin call, forced liquidation, physical/cash settlement…).
- `design`: data model (SQL DDL), API, luồng chính bằng ~~~seq, cấu trúc dữ liệu cốt lõi kèm code Java ngắn có comment, xử lý đồng thời và nhất quán, số liệu hiệu năng mục tiêu (p99, throughput) và cách đo.
- `milestones` 6–8 mốc, mỗi `guide` hướng dẫn từng bước như dạy người mới, có lệnh chạy, test (JUnit 5, Testcontainers, jmh khi đo hiệu năng) và tiêu chí xong.
- `interview`: story STAR có số liệu đo được từ chính dự án; 8 câu hỏi interviewer sàn giao dịch hay hỏi + đáp án.
- `related`: id câu hỏi có thật trong bank (banking, concurrency, jvm, db, microservices, design) — kiểm bằng `node scripts/qtool.js list js/data/<file>`.
- Có mục "sự cố production giả định" (consumer lag tăng khi thị trường biến động mạnh): triệu chứng → điều tra → sửa → số đo.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM 1 object** vào cuối mảng `window.PROJECTS` trong `js/data/projects.js` (chèn trước dòng `];` cuối file); không sửa dự án khác, không sửa file khác. Đếm số dự án trước/sau.
- Kiến thức đúng: Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, QuickFIX/J, FIX 4.4. Không bịa API/flag/thông số sàn.

## Nghiệm thu
`node --check js/data/projects.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn (dòng "Pet project: N dự án" tăng 1). KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id dự án.

## Notes
Reviewed-by: verify-only (code/UI task)
