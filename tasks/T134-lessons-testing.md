# T134 — Track bài học `testing`: Kỹ thuật testing, tự xây công cụ nhỏ

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-testing.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. **3 bài** `lesson-testing-001..003` (track `testing`, order 1..3): (1) test double: tự viết fake repository vs stub vs mock đếm lời gọi (verify số lần), khi nào dùng cái nào; (2) clock injection để test code phụ thuộc thời gian (java.time.Clock.fixed / offset); (3) property-based testing mini: sinh input ngẫu nhiên với seed cố định (new Random(42)) để tìm bug trong hàm sort/merge tự viết.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 3 bài `lesson-testing-001..003` (order 1..3) vào `js/data/lessons-testing.js`, mỗi bài 1 exercise Java 17 tự chấm, 3 câu `check`.
- 001: fake repository ghi bằng HashMap + spy notifier ghi lời gọi, minh hoạ state vs interaction verification.
- 002: inject `java.time.Clock`, test bằng `Clock.fixed`/`Clock.offset`; exercise TrialService (expiry, active, daysRemaining làm tròn lên). Cần import `java.time.*` và `java.time.temporal.ChronoUnit` trong code bài tập vì `App.code.assemble` không tự thêm.
- 003: harness PBT tối giản `check(name, seed, trials, property)` + `merge`; test dùng `new Random(42)`, property sorted/cùng đa tập, kiểm tra counterexample có seed/trial.
- `node scripts/validate.js` → OK. `node scripts/test-lessons.js lesson-testing-001|002|003` → 6/6 mỗi bài. Chạy full suite gặp lỗi EPERM khi `fs.rmSync` xoá thư mục tạm trên Windows (ngoài phạm vi file này), không liên quan nội dung bài học; đã xác nhận từng bài riêng.

Reviewed-by: opencode (T134R)
