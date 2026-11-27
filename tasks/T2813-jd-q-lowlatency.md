# T2813 — 4 câu hỏi theo JD MXV: Java độ trễ thấp và profiling

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`

Thêm **4 câu hỏi** (topic `concurrency` hoặc `jvm` cho đúng nội dung) vào `js/data/q-concurrency-jvm.js`, bám JD:
- JD Java Backend Developer (Middle–Senior) tại Sở Giao dịch Hàng hóa Việt Nam (MXV), Hà Nội: module giao dịch, khớp lệnh, quản lý tài khoản/ký quỹ (margin), nạp rút, market data real-time qua WebSocket, FIX Protocol, Kafka; tối ưu CPU/memory/GC, query, cache (Redis, Hazelcast); distributed transaction, concurrency control, deadlock, data consistency; Java 17/21, Spring Boot/Data/Security, gRPC, MongoDB, Docker, CI/CD, JProfiler/VisualVM; ưu tiên order book, risk, margin, statement, K8s.

Câu cần có:
1. Hệ thống khớp lệnh cần p99 < 1 ms: chọn GC (G1 vs Generational ZGC), giảm allocation trên hot path, đo bằng GC log/JFR; số liệu trước/sau. (senior)
2. False sharing và single-writer principle: vì sao ring buffer kiểu LMAX Disruptor nhanh hơn BlockingQueue; padding/@Contended ở mức nguyên lý; khi nào KHÔNG cần. (lead)
3. Profiling CPU/memory trên production: JFR, async-profiler, VisualVM/JProfiler — mỗi công cụ hợp lúc nào, overhead, quy trình tìm hot method và memory leak. (senior)
4. Đẩy market data real-time qua WebSocket tới 50.000 client: backpressure, slow consumer, conflation (gộp tick), thread model, Kafka làm nguồn. (senior)

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `'jd-2026-12'`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (nếu trùng thì chọn góc sâu hơn, ghi Notes).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ.**
- **Chỉ THÊM** vào `js/data/q-concurrency-jvm.js` (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau.
- Không backtick, không `${` trong template literal.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, FIX 4.4/5.0 SP2 khi nói về FIX). Không bịa tag, API, flag. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, chuẩn bị phỏng vấn đúng JD bên dưới: giải thích từ gốc, từng bước, VÌ SAO.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu vào js/data/q-concurrency-jvm.js (chèn trước `);` cuối file, không sửa câu cũ):
- jvm-085 (senior): GC cho khớp lệnh p99 < 1 ms, G1 vs Generational ZGC, giảm allocation hot path, đo GC log/JFR.
- concurrency-096 (lead): false sharing + single-writer, ring buffer kiểu Disruptor vs BlockingQueue, padding/@Contended, khi KHÔNG cần.
- concurrency-097 (senior): profiling production (JFR, async-profiler, VisualVM/JProfiler), quy trình tìm method nóng và rò rỉ bộ nhớ.
- concurrency-098 (senior): WebSocket 50.000 client, Kafka nguồn, backpressure, slow consumer, conflation, mô hình luồng.
Mọi câu có **Tóm tắt:**, Ví dụ đời thực có số liệu, Trả lời mẫu, > Senior tip, follow 2–3 câu, tags có 'jd-2026-12'.
node --check OK; qtool check OK cho 4 id mới (lỗi còn lại của validate là file khác, không do tôi); index-light.js đã chứa 4 id mới. Không commit.
Reviewed-by: kilo (T2813R)
