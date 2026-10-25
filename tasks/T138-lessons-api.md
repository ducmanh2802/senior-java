# T138 — Track bài học `api`: HTTP & REST nền tảng

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-api.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. Người học: dev Java junior hổng nền, đang lên Senior. **3 bài** `lesson-api-001..003` (track `api`, order 1..3, level mid/mid/senior): (1) HTTP từ bên trong: method an toàn/idempotent, status code đúng chỗ, header Content-Type/Cache-Control — bài tập: tự viết parser một HTTP request dạng text thành method/path/headers/body; (2) thiết kế REST resource + validation + lỗi chuẩn (Problem Details) — bài tập: router nhỏ map (method, path pattern /accounts/{id}) → handler, trả 404/405 đúng; (3) idempotency key cho POST — bài tập: store lưu kết quả theo key, request lặp trả lại kết quả cũ, cùng key khác body → 422.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn, mô phỏng cơ chế bằng Java thuần (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`, `related` trỏ tới id câu hỏi có thật topic `api`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 3 bài `lesson-api-001..003` (order 1..3, level mid/mid/senior) vào `js/data/lessons-api.js`; mỗi bài 1 exercise Java 17 thuần, 4 câu `check`, `related` là id thật của topic `api`.
- Exercise: (1) parser HTTP request thô (CRLF/LF, header case-insensitive, body không trim) — 6 case; (2) router pattern `/accounts/{id}`, 404/405 + `Allow`, literal ưu tiên hơn biến, bỏ query/trailing slash — 7 case; (3) idempotency store (replay, 422 khi khác body, key rỗng, 8 thread cùng key chỉ chạy action 1 lần) — 6 case.
- `node scripts/test-lessons.js lesson-api-001|002|003` → reference pass 100% (6/6, 7/7, 6/6), starter không pass.
- `node scripts/validate.js lessons-api.js` → `OK — không có lỗi.` (exit 0), body dài 6617/5707/6321 ký tự.
- **Blocker ngoài phạm vi task:** `node scripts/validate.js` (toàn bộ) đang báo `algo.js: lỗi cú pháp/chạy: Unexpected identifier 'undefined'`. Nguyên nhân: template literal `solution` của bài `longestValidParentheses` trong `js/data/algo.js` thiếu dấu backtick đóng ở cuối dòng 7182 (ngay trước `tests:` dòng 7184). File này thuộc task khác nên tôi **không sửa** theo luật mục 3 AGENTS.md. Đề xuất cho integrator: thêm một dấu `` ` `` sau `... kết quả cuối.',` ở dòng 7182 rồi chạy lại validate. Lỗi này không liên quan tới `lessons-api.js`.
Reviewed-by: opencode (T138R)
