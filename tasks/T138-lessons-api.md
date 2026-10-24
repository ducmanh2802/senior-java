# T138 — Track bài học `api`: HTTP & REST nền tảng

Status: TODO
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-api.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. Người học: dev Java junior hổng nền, đang lên Senior. **3 bài** `lesson-api-001..003` (track `api`, order 1..3, level mid/mid/senior): (1) HTTP từ bên trong: method an toàn/idempotent, status code đúng chỗ, header Content-Type/Cache-Control — bài tập: tự viết parser một HTTP request dạng text thành method/path/headers/body; (2) thiết kế REST resource + validation + lỗi chuẩn (Problem Details) — bài tập: router nhỏ map (method, path pattern /accounts/{id}) → handler, trả 404/405 đúng; (3) idempotency key cho POST — bài tập: store lưu kết quả theo key, request lặp trả lại kết quả cũ, cùng key khác body → 422.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn, mô phỏng cơ chế bằng Java thuần (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`, `related` trỏ tới id câu hỏi có thật topic `api`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
