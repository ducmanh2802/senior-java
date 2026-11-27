# T2817 — Pet project: bù trừ, ký quỹ và thanh toán lãi lỗ hằng ngày (clearing & margin)

Status: DONE
Agent: kilo
Owns: `js/data/projects.js`
After: T2816

Thêm dự án `proj-clearing-margin` (level senior, 10 tuần). Đọc `proj-commodity-exchange` vừa có và **nối tiếp**: nhận trade từ sàn đó qua Kafka.

Bối cảnh: người học là dev Java 5 năm (Spring Boot, tối ưu query, review code), muốn vào sàn giao dịch **phái sinh hàng hoá** (kiểu Sở Giao dịch Hàng hóa Việt Nam – MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD mục tiêu: module giao dịch, khớp lệnh, tài khoản/ký quỹ, nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, tối ưu GC/CPU/query/cache (Redis, Hazelcast), distributed transaction, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Dự án phải giúp họ **kể được trong phỏng vấn** và **chạy được trên laptop** (Docker Compose).

Phạm vi: sổ vị thế (position keeping) theo tài khoản × hợp đồng, giá thanh toán cuối ngày (settlement price), **mark-to-market và variation margin hằng ngày**, ký quỹ ban đầu/duy trì (mô hình đơn giản theo kịch bản giá, nói rõ khác SPAN thật), gọi ký quỹ (margin call) và **tất toán bắt buộc** (forced liquidation) khi thiếu ký quỹ, ledger bút toán kép cho tiền ký quỹ, nạp/rút tiền có idempotency, batch EOD bằng Spring Batch hoặc job tự viết có checkpoint, đối soát và sao kê (statement) cho khách. Xử lý đồng thời: cập nhật số dư khả dụng khi đang có lệnh mới (optimistic vs `SELECT … FOR UPDATE`), tránh deadlock khi chuyển tiền giữa 2 tài khoản.

## Cách viết
- **Đọc kỹ dự án mẫu `proj-wallet`** (đầu `js/data/projects.js`) và giữ **đúng schema + độ sâu**: `id, title, level, weeks, skills, business{intro, journeys[{title,persona,steps}], diagrams[{title,caption,actors,steps}], glossary[{term,meaning}]}, pitch, requirements, architecture, design, milestones[{title,tasks,done,guide}], challenges, readme, interview{story, questions, answers}, related`.
- `business` giải thích nghiệp vụ phái sinh **cho người chưa biết gì về tài chính**: ví dụ có số (1 hợp đồng ngô CBOT = 5.000 bushel, bước giá, ký quỹ ban đầu, lãi lỗ theo ngày…); số liệu sàn thật chỉ ghi khi chắc chắn, kèm "(tham khảo, kiểm tra contract spec của sàn)". glossary ≥ 12 thuật ngữ (futures, contract month, tick size, initial/maintenance margin, mark-to-market, variation margin, open interest, position limit, settlement price, margin call, forced liquidation, physical/cash settlement…).
- `design`: data model (SQL DDL), API, luồng chính bằng ~~~seq, cấu trúc dữ liệu cốt lõi kèm code Java ngắn có comment, xử lý đồng thời và nhất quán, số liệu hiệu năng mục tiêu (p99, throughput) và cách đo.
- `milestones` 6–8 mốc, mỗi `guide` hướng dẫn từng bước như dạy người mới, có lệnh chạy, test (JUnit 5, Testcontainers, jmh khi đo hiệu năng) và tiêu chí xong.
- `interview`: story STAR có số liệu đo được từ chính dự án; 8 câu hỏi interviewer sàn giao dịch hay hỏi + đáp án.
- `related`: id câu hỏi có thật trong bank (banking, concurrency, jvm, db, microservices, design) — kiểm bằng `node scripts/qtool.js list js/data/<file>`.
- Có bảng ví dụ tính tay 3 ngày lãi lỗ của 1 vị thế (giá vào, giá thanh toán từng ngày, variation margin, số dư ký quỹ, ngày bị margin call).

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM 1 object** vào cuối mảng `window.PROJECTS` trong `js/data/projects.js` (chèn trước dòng `];` cuối file); không sửa dự án khác, không sửa file khác. Đếm số dự án trước/sau.
- Kiến thức đúng: Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, QuickFIX/J, FIX 4.4. Không bịa API/flag/thông số sàn.

## Nghiệm thu
`node --check js/data/projects.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn (dòng "Pet project: N dự án" tăng 1). KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id dự án.

## Notes
- Đã thêm object `proj-clearing-margin` (level senior, 10 tuần) vào cuối `window.PROJECTS` trong `js/data/projects.js`, nối tiếp `proj-commodity-exchange` (nhận trade đã khớp qua Kafka).
- Đầy đủ schema: business (intro ≥ 1200, 3 journeys, 2 diagrams ~~~seq, 16 glossary), pitch, requirements, architecture, design (DDL + API + seq + code Java + concurrency + perf), 7 milestones (guide ≥ 800), 5 challenges, readme, interview (8 câu + 8 đáp án ≥ 300), related 10 id có thật.
- Có bảng tính tay 3 ngày lãi/lỗ (long 2 ngô @ 4,20; settlement 4,25/4,15/4,05; VM; margin call ngày 3).
- `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js`: không còn lỗi thuộc projects.js (các lỗi còn lại thuộc file khác). "Pet project: 17 dự án" (tăng 1).
- Không commit, không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
