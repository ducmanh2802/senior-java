# T2640R — Fact-check nội dung mới của T2640

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2640 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed lesson-jvm-011 (thread dump/deadlock) and lesson-jvm-012 (static cache leak/LRU) in js/data/lessons-jvm.js. Kiến thức kỹ thuật đã kiểm tra: đúng (Found one Java-level deadlock, BLOCKED chờ monitor, static field là GC root, LRU qua LinkedHashMap accessOrder=true, Caffeine là thư viện thực). Không có lỗi markup (không backtick, không `${`, fences không có), không trùng id, related (jvm-003, jvm-004) tồn tại trong q-concurrency-jvm.js.

Lỗi đã sửa (chỉ file sở hữu):
1. lesson-jvm-012 exercise tests: khai báo `static class BoundedCache` lồng trong `Main` làm masks class starter → assemble giữ bản sao trong test, starter sẽ pass trivially. Đã xoá clase lồng, test dùng class cấp cao nhất từ starter/reference (giống mẫu lesson-jvm-011 LockCounter).
2. lesson-jvm-011 starter/tests/reference: `\n` trong chuỗi Java bị trình phân tích JS hiểu thành ký tự xuống dòng thật → code Java sinh ra bị lỗi compile (chuỗi chưa đóng, `split("` + newline). Đã sửa thành `\\n` để Java giữ `\n`.

Xác nhận: `node --check js/data/lessons-jvm.js` OK; cả 2 bài tập: reference pass 3/3 (`RESULT 3/3`), starter ném `UnsupportedOperationException` (fail như yêu cầu cổng). `node scripts/build-light-index.js` → OK (index-light.js sinh lại theo mục 6 AGENTS.md). `node scripts/validate.js` → không báo lỗi nào trên lessons-jvm.js; lỗi/cảnh báo còn lại (lessons-banking.js -017/-018 body ngắn, q-* đáp án ngắn, path.js) nằm trong file của các task khác — không đục theo mục 3 AGENTS.md.