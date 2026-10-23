# T05 — Nội dung: System Design, Design Patterns & Clean Architecture

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `design` và `architecture` theo `AGENTS.md` mục 4–6. ID bắt đầu từ `design-001` và `architecture-001`.
Văn phong theo mẫu `core-001` trong `js/data/q-java.js`.

Câu system design dài hơn bình thường (có thể tới ~3500 ký tự) và đi theo khung:
**Làm rõ yêu cầu (functional / non-functional) → Ước lượng (QPS, storage) → API → Data model → Kiến trúc tổng thể → Đi sâu vào điểm nghẽn → Trade-off & mở rộng.**
Sơ đồ vẽ bằng ASCII trong block `~~~text`.

## Danh sách câu hỏi (bắt buộc bao phủ)
### design (≥ 12 câu)
- Framework trả lời một câu system design trong 45 phút (câu meta, level senior)
- Thiết kế URL shortener
- Thiết kế rate limiter (token bucket / sliding window, phân tán với Redis)
- Thiết kế hệ thống flash sale / đặt vé chịu tải cao, chống oversell
- Thiết kế hệ thống thanh toán / ví điện tử (idempotency, ledger, reconciliation)
- Thiết kế notification service (email/SMS/push, retry, ưu tiên)
- Thiết kế news feed / timeline (fan-out on write vs read)
- Thiết kế chat realtime (WebSocket, presence, lưu tin nhắn)
- Caching: cache-aside / write-through / write-behind, invalidation, cache stampede, hot key
- Distributed lock (Redis Redlock tranh cãi, ZooKeeper/etcd, fencing token)
- CAP / PACELC, consistency models; chọn DB cho từng yêu cầu
- Scale từ 1k lên 1M user: lộ trình kiến trúc
- Thiết kế job scheduler phân tán / xử lý batch lớn
### architecture (≥ 8 câu)
- SOLID áp dụng thực tế (có ví dụ code Java vi phạm → sửa)
- Design pattern trong Spring (Proxy, Template Method, Factory, Strategy, Observer…)
- Strategy + Spring injection {{Map<String, Strategy>}} để loại bỏ if-else
- Clean / Hexagonal architecture: package structure cho Spring Boot, ưu nhược
- DDD: aggregate, entity vs value object, domain event; aggregate boundary & transaction
- Quản lý technical debt & refactor legacy code an toàn
- Viết ADR (Architecture Decision Record) & đánh giá trade-off kiến trúc
- Anti-pattern hay gặp: God class, anemic domain model, distributed monolith

## Notes
- Đã thêm 21 câu: `design-001..013` (13 câu, đủ danh sách bắt buộc) và `architecture-001..008` (8 câu, đủ danh sách bắt buộc).
- Level: 5 mid, 13 senior, 3 lead. Đáp án dài ~3.600–6.700 ký tự, có `**Tóm tắt:**`, sơ đồ ASCII trong `~~~text`, bảng trade-off, pitfall production và `> Senior tip:`.
- `node --check js/data/q-system-design.js` OK; `node scripts/validate.js q-system-design.js` in `OK — không có lỗi.` (không có cảnh báo nào cho file này).
- Lưu ý cho integrator: tại thời điểm hoàn thành, `node scripts/validate.js` toàn repo vẫn báo lỗi cú pháp ở `js/data/q-concurrency-jvm.js` (backtick trong template literal tại dòng 64, thuộc T02) nên chưa thể in OK toàn cục. Không sửa file ngoài quyền sở hữu; cần T02 xử lý rồi chạy lại validator.
Reviewed-by: codex (T05R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
