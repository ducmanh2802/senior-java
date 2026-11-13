# T2020 — 6 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1718

Thêm **6 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Kafka consumer group rebalance và mất/lặp message, exactly-once thực tế (idempotent producer, transactional outbox), dead letter topic và retry có backoff, đồng bộ dữ liệu giữa service (event-carried state transfer), versioning API giữa các service, timeout budget khi gọi chuỗi service (không phải đề đã có trong file — đọc trước).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu (75 → 81), tất cả `topic: 'microservices'`, mỗi câu 7–9,5 nghìn ký tự, có **Tóm tắt:**, mục giải thích cơ chế từng bước, code ≤ 30 dòng, bảng trade-off, `### Lỗi hay gặp`, `### Ví dụ đời thực` (triệu chứng → điều tra → xử lý → kết quả đo được, số liệu khớp nhau trong cùng bài), `### Trả lời mẫu khi phỏng vấn` (148–171 từ) và `> Senior tip:`. Có 3 câu `follow`.

| id | level | Chủ đề | Góc tiếp cận (khác câu đã có) |
|---|---|---|---|
| microservices-076 | senior | rebalance + mất/lặp message | **ack mode và thời điểm commit offset**: BATCH/RECORD/MANUAL/MANUAL_IMMEDIATE, auto-commit, `onPartitionsRevoked`, `CommitFailedException`, batch listener. Bổ trợ 030/052 (cơ chế rebalance) và 031 (inbox) |
| microservices-077 | senior | DLT + retry có backoff | **Quy trình replay 1,2 triệu message**: phân loại 3 nhóm, quarantine, throttle 500 msg/s, giữ key, header audit, đo 3 con số. 020/034 chỉ nói cấu hình retry |
| microservices-078 | senior | event-carried state transfer | **Nhân bản dữ liệu tham chiếu cho đường ghi** (không phải read view dashboard của 028): snapshot + delta, upsert có điều kiện version, rebuild, **xoá dữ liệu theo GDPR + crypto-shredding** |
| microservices-079 | senior | versioning API giữa các service | **Client không kiểm soát được (mobile)**: N-1 theo DAU, additive-only, enum mới là breaking, telemetry theo version, quy trình sunset + 410 Gone. Khác 014 (expand-contract nội bộ, Pact) |
| microservices-080 | lead | timeout budget khi gọi chuỗi service | **Đo và chia budget theo tầng**: p99/p99.9, Little's law (λ·W), Hikari connectionTimeout 30s, `statement_timeout`, `lock_timeout`, connect/response timeout. Bổ trợ 025 (deadline propagation) và 058 (bulkhead) |
| microservices-081 | lead | exactly-once thực tế | **Chứng minh exactly-once**: test bơm trùng, crash test giữa side effect và commit, replay test, reconciliation + metric `duplicate_blocked_total`, `reconciliation_diff` |

Kiểm tra:
- `node --check js/data/q-microservices.js` → OK.
- `node scripts/qtool.js append` (chỉ ghi file này, xác minh 75 object cũ không đổi) → 6 object mới.
- `node scripts/qtool.js check js/data/q-microservices.js` → OK.
- `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js`.
- `node scripts/validate.js` → **không còn lỗi nào thuộc file này**; lỗi còn lại duy nhất là `bugs.js: bug-023: tests phải in "RESULT passed/total"` thuộc task khác đang làm dở (T2022, file `js/data/bugs.js` đang có 473 dòng thêm chưa commit), task này không sở hữu `bugs.js` nên không sửa.

Không sửa file nào ngoài `js/data/q-microservices.js`, `js/data/index-light.js` (sinh tự động) và file task này. Không commit, không push, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T2020R)
