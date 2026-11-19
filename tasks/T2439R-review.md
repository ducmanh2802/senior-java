# T2439R — Fact-check nội dung mới của T2439

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2439 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 câu mới `qz-concurrency-046..055` trong `js/data/quiz.js`. Các lỗi đã sửa:

- **qz-concurrency-046**: phương án nhiễu "4 task chạy, 16 xếp hàng, không bị từ chối" thực chất mô tả đúng trạng thái (queue không giới hạn nhận hết) → trùng đáp án đúng với option 1. Sửa thành "4 chạy, 16 bị từ chối" cho rõ sai và cập nhật phần giải thích.
- **qz-concurrency-048**: `completeOnTimeout` bị mô tả như cách "thực sự dừng task" — sai; `orTimeout`/`completeOnTimeout` chỉ đổi trạng thái future, không dừng task. Viết lại: muốn dừng phải `cancel(true)`/`shutdownNow()`/`interrupt` trên Future của task.
- **qz-concurrency-049**: giải thích ghi "add()/remove() ném IllegalStateException" — sai kiểu lỗi: `add()` ném `IllegalStateException`, `remove()` ném `NoSuchElementException`, và đây là hợp đồng của `Queue` không riêng `ArrayBlockingQueue`. Đã sửa. (Đáp án đúng giữ nguyên.)
- **qz-concurrency-050**: option 0 "sum() trả về giá trị chính xác kể cả khi đang increment" SAI — `LongAdder.sum()` không phải atomic snapshot. Sửa option 0 thành phát biểu đúng ("không atomic, có thể thiếu cập nhật đồng thời") và cập nhật explain; đáp án `[0,3]` giữ nguyên.
- **qz-concurrency-054**: đáp án gốc sai. Với core=10, max=20, queue=ArrayBlockingQueue(50), submit 100 task: 10 core chạy + 20 (queue đầy) + 10 thread thêm tới max → **20 chạy, 50 xếp hàng, 30 bị từ chối** (option 1), không phải 10/50/40. Sửa `answer 0 → 1` và viết lại explain + phần "phương án sai".

Các câu còn lại (047, 051, 052, 053, 055) đã kiểm tra, nội dung kỹ thuật đúng (JEP 491 Java 24, ScopedValue finalized Java 25, scheduleAtFixedRate không chạy chồng, ThreadLocal leak qua ThreadLocalMap/weak key) — không sửa.

Kiểm tra: `node --check js/data/quiz.js` OK; validator không còn lỗi nào thuộc `quiz.js`. `js/data/index-light.js` đã chứa sẵn id 046–055 (T2439 đã rebuild, id không đổi khi review) nên không cần build lại cho riêng quiz. Các LỖI còn lại của `node scripts/validate.js` đều thuộc `lessons-spring.js` / `lessons-microservices.js` (task khác đang làm dở) và `index-light` do các bài học đó thay đổi — ngoài phạm vi file này.
