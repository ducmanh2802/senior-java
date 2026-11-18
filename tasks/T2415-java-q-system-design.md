# T2415 — 3 câu hỏi Senior Java (design) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2395

Thêm **3 câu hỏi phỏng vấn mới** (topic: design) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: system design dài (≥ 5000 ký tự, có ~~~seq): (1) hệ thống phân công & điều phối task cho nhân viên vận hành (routing, priority, escalation, audit trail); (2) nền tảng notification đa kênh (push/SMS/email/webhook) 10 triệu tin/ngày; (3) hệ thống đặt lệnh chứng khoán chịu tải giờ mở cửa (ATO) 5.000 lệnh/giây.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu (id nối tiếp, không trùng ý các câu đã có: design-013 là job scheduler, design-006/030/049 là notification nhưng góc khác — 049 tập trung dedupe/retry/on-kênh, 067 thêm 10tr tin/ngày + frequency cap/opt-out/fallback/đối soát; design-017 là matching engine, 068 thêm ATO + WAL/sequencer/HA):
  - **design-066** (senior) — hệ thống phân công & điều phối task cho 5.000 agent fintech: reconcile loop, chấm điểm (skill/load/sla), gán bằng UPDATE có version (chống gán trùng), aging chống đói, escalation quét sla_due_at, audit_log append-only; có ~~~seq; ví dụ partial index + bỏ FOR UPDATE toàn bảng.
  - **design-067** (senior) — notification đa kênh 10tr tin/ngày: queue tách theo kênh, outbox pattern, idempotency key + unique constraint, frequency cap (Redis sliding window), opt-out, retry backoff+jitter + circuit breaker + DLQ, webhook đối soát; có ~~~seq; ví dụ SMS delivered 61%→96%.
  - **design-068** (lead) — nhận & xử lý lệnh chứng khoán giờ ATO 5.000 lệnh/giây: gateway validate + WAL group commit + trả 202, risk → sequencer (1 sequencer/mã) → matching, idempotency client_order_id, replicate + standby replay, SSE/poll trạng thái; có ~~~seq; ví dụ đồng bộ → async WAL kéo 5xx 18%→0.
- Kiểm tra: `node --check js/data/q-system-design.js` OK; `node scripts/qtool.js check` OK cho 3 câu mới; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` — **không có lỗi nào thuộc q-system-design.js** (các LỖI còn lại là q-english.js trùng id english-051..055, do task khác sở hữu, ngoài phạm vi T2415).
Reviewed-by: kilo (T2415R)
