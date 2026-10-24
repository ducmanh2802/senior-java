# T132 — Track bài học `sql`: SQL engine tự mô phỏng bằng Java

Status: TODO
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-sql.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. **3 bài** `lesson-sql-001..003` (track `sql`, order 1..3): (1) join algorithms: tự viết nested-loop join và hash join trên List<record>, so sánh số phép so sánh; (2) keyset vs offset pagination trên TreeMap, đếm số dòng phải duyệt; (3) window function: tự cài ROW_NUMBER/running total theo partition bằng stream.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
