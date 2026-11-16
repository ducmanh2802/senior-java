# T2195R — Fact-check nội dung mới của T2195

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2195 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check 6 chỗ MỚI trong `git diff HEAD -- js/data/q-concurrency-jvm.js`. Tất cả đều đã được sửa thành **đúng kỹ thuật**, không có lỗi kiến thức còn lại. Không sửa nội dung HEAD, không thêm/xoá mục.

| id | kiểm tra | kết luận |
|---|---|---|
| concurrency-066 (bảng AtomicLong vs LongAdder) | `LongAdder.sum()` không phải ảnh chụp nguyên tử: có thread đang `increment()` thì đọc có thể thiếu vài đơn vị | ĐÚNG — "Gần đúng khi đọc (sum), không phải ảnh chụp nguyên tử" |
| concurrency-066 (pitfall reset) | `reset()`/`sumThenReset()` không nguyên tử với `increment()` nên mất số đếm; reset chỉ đưa base và các cell về 0, **không** thu hồi mảng `Cell[]` (xem `Striped64`/`LongAdder.reset()`) | ĐÚNG — thay câu sai cũ ("cell tích lũy vô hạn, reset giải phóng bộ nhớ") |
| concurrency-068 (fair queue) | fair=true trên `ArrayBlockingQueue` đánh thức theo FIFO → throughput giảm, nhưng con số "10–30%" không có nguồn | ĐÚNG — bỏ con số bịa, giữ ý định tính |
| concurrency-069 (Phaser bên trong) | JDK dùng `state` (long) + hai hàng đợi `evenQ`/`oddQ` chứa `QNode` để đánh thức theo pha; **không** phải "treap" | ĐÚNG — sửa cơ chế bị nói sai |
| concurrency-071 (bảng interrupt) | `LockSupport.park()` **không** ném `InterruptedException`, chỉ trả về sớm và **giữ nguyên** cờ ngắt (true); muốn biết bị ngắt phải tự kiểm tra `isInterrupted()`/`Thread.interrupted()` | ĐÚNG — tách `park` khỏi hàng "ném exception" |
| concurrency-077 (ScopedValue) | ScopedValue preview Java 20–24 (JEP 429 incubator, 446/464/481/487 preview), **chính thức JDK 25 qua JEP 506**; không phải "chính thức JDK 24, JEP 481" | ĐÚNG — sửa version/JEP |

Kiểm tra markup: không có backtick thô, không có `${` trong template literal; mọi `###`, `|...|`, `> Senior tip:` đều đúng cú pháp. Không có chữ nước ngoài lẫn vào.

Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (đã chạy, pass). Syntax `node --check js/data/q-concurrency-jvm.js` → OK. Không có câu hỏi/bài học mới thêm nên không cần `build-light-index.js` hay `test-lessons.js`.
