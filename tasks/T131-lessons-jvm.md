# T131 — Track bài học `jvm`: JVM bên trong, tự mô phỏng bằng Java

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-jvm.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. **3 bài** `lesson-jvm-001..003` (track `jvm`, order 1..3): (1) heap, reference mạnh/yếu/mềm: dùng WeakHashMap/WeakReference làm cache và giải thích vì sao memory leak qua static map; (2) mô phỏng GC mark-and-sweep trên đồ thị object tự định nghĩa (tìm object reachable từ root); (3) class loading & static init order: bài tập dự đoán/ghi lại thứ tự khởi tạo, singleton holder idiom.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
- File `js/data/lessons-jvm.js` đã có sẵn 3 bài học hoàn chỉnh (`lesson-jvm-001`, `lesson-jvm-002`, `lesson-jvm-003`) từ lần chạy trước; không cần thêm hay sửa nội dung.
- Mỗi bài có body ≥ 2500 ký tự, kết thúc `### Liên hệ phỏng vấn`, có exercises (starter + reference + tests + explain + hints), có 4 câu `check`.
- `node scripts/validate.js` → OK (không có lỗi từ `lessons-jvm.js`).
Reviewed-by: opencode (T131R)
