# T2716R — Fact-check nội dung mới của T2716

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2716 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa trong `js/data/lessons-jvm.js` (nội dung T2716, lesson-jvm-013..018):

lesson-jvm-013:
- body: `{{jstack <pid>})` → `{{jstack <pid>}}` (thiếu `}}` → số `{{`/`}}` không khớp và inline code chứa `{ }` lồng nhau).
- exercises[0].tests + reference: `\n` `\r` `\"` trong template literal JS biến thành ký tự điều khiển thô trong file Java sinh ra → lỗi biên dịch "unclosed string literal". Đổi thành `\\n` `\\r` `\\"` để Java giữ escape `\n` `\r \"` hợp lệ.
- reference.holdAndWait: `out.put(e.name, e.waits)` → `out.put(e.name, "<" + e.waits + ">")` để xuất `<0x...>` khớp định dạng trong prompt.
- reference.topContendedLockWithOwner: `out.add(lock + ...)` → `out.add("<" + lock + "> ...)` (thêm `<` `>` quanh địa chỉ) khớp định dạng `<địa chỉ> waiters=...`.
- tests.DUMP1/DUMP2: xoá `worker-3` (entry giống hệt nhau giữa hai dump → counted stuck làm sai stuckThreads; parks LOCK_C tạo waiter thứ 3 làm sai số lượng lock topContendedLockWithOwner).
- tests.d3: thêm frame `at demo.Worker.run(Worker.java:5)` cho `worker-1` và `worker-2` (chủ sở hữu khoá) để ownerTop không rỗng.

lesson-jvm-014:
- exercises[0].tests: `eq(60, c.sizeBytes())`, `eq(100, c.sizeBytes())`, `eq(0, c.sizeBytes())` so sánh `int` với `long` (`Objects.equals(Integer, Long)` luôn false) → đổi thành `60L`/`100L`/`0L`.
- exercises[0].tests: `eq(1, c.get("b"))` nhưng `c.put("b", 2, 40)` → `get("b")` trả về 2 → đổi thành `eq(2, c.get("b"))`.

Kết quả: tất cả 6 bài tập mới (lesson-jvm-013..018) reference compile được và pass ≥3 test (xác minh bằng javac --release 17, chạy thủ công vì test-lessons.js bị chặn do lessons-devops.js lỗi cú pháp ở file khác).

Blocker (không thuộc file tôi sở hữu, không được sửa):
- `js/data/lessons-devops.js`: lỗi cú pháp "Unexpected end of input" (dòng 6285) → chặn `node scripts/build-light-index.js` và `node scripts/test-lessons.js` (nạp toàn bộ file lessons) và gây `path.js` báo lesson-devops-* không tồn tại.
- `js/data/quiz-ops.js`: lỗi markup (### thụt đầu dòng, {{}}/{{}} không khớp, inline code dấu { } lồng nhau) ở qz-ai-051..060.
- `js/data/lessons-jpa.js`: lesson-jpa-020 body < 2500 ký tự.
- `js/data/path.js`: 181 bài học không nằm trong PATH (trước do lessons-devops.js không nạp được).
- `js/data/index-light.js`: cũ (không thể sinh lại do lessons-devops.js lỗi cú pháp).

Do có lỗi trước đó ở các file ngoài quyền sở hữu, `node scripts/validate.js` không thể in `OK` trong trạng thái hiện tại (chỉ còn các lỗi ở file khác, không có lỗi nào trong lessons-jvm.js).
