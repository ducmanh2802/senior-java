# T2314 — 5 câu phỏng vấn microservices mới

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2136

Đọc AGENTS.md mục 4–6; `node scripts/qtool.js list js/data/q-microservices.js` để không trùng ý.
Thêm 5 câu: idempotent consumer với bảng processed_messages (Kafka at-least-once), transactional outbox với CDC (Debezium) vs polling publisher, saga orchestration vs choreography khi luồng có bù trừ, versioning event schema (backward/forward compatible, schema registry), timeout budget lan truyền qua chuỗi service (deadline propagation).
Đúng chuẩn mục 6, có `~~~seq` cho luồng nhiều bên.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm) — có task trước ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/q-microservices.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Đã thêm 5 câu vào `js/data/q-microservices.js` trước `);` cuối file: `microservices-093` → `microservices-097`.
- Số id trước: 92 (`microservices-092` là cuối). Sau: 97. Tăng đúng 5.
- Nội dung: 093 idempotent consumer + bảng processed_messages; 094 transactional outbox: CDC (Debezium) vs polling publisher (SKIP LOCKED); 095 saga orchestration vs choreography + compensation; 096 event schema versioning/compatibility + Schema Registry; 097 deadline propagation qua thread/async/gRPC. Mỗi câu có `~~~seq`.
- Kiểm tra: `node --check js/data/q-microservices.js` OK; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js js/data/q-microservices.js` → `OK — không có lỗi.`
- `node scripts/validate.js` toàn repo hiện còn lỗi ngoài phạm vi task: `sdlc.js` lỗi cú pháp `missing ) after argument list`, `labs-thread.js` id `lab-thread-007`/`lab-thread-008` sai dạng; các file này do task khác sở hữu và đang được sửa, không thay đổi trong task này.
- Không chạy git commit/push; không sửa file ngoài `js/data/q-microservices.js` và `js/data/index-light.js` (build artifact).
