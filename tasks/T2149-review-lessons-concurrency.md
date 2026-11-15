# T2149 — Rà soát chất lượng 4 bài học mới nhất (order lớn nhất) trong lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2088

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (order lớn nhất) trong `js/data/lessons-concurrency.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body đúng kỹ thuật (Java 17/21, Spring Boot 3, Hibernate 6); giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; explain nêu lỗi hay gặp; câu check có đáp án đúng và explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; node scripts/test-lessons.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-concurrency-015 | Thiếu giải thích từ gốc: context switch, daemon/non-daemon, OOM, RAM, FIFO, backpressure, thread starvation deadlock, downstream, throughput, connection pool, thread dump, Micrometer; snippet constructor dùng hàm không có thật `namedFactory(...)`; câu hướng dẫn pool "Khong shutdown pool cua nguoi goi" gây hiểu nhầm; lặp từ "duoc duoc". | Thêm giải thích ngắn ngay lần đầu xuất hiện; thay `namedFactory` bằng ThreadFactory lambda thật; sửa câu hướng dẫn thành "pool tạo và shutdown trong hàm"; sửa lỗi lặp từ. |
| lesson-concurrency-016 | Ví dụ `Integer::normalize` không tồn tại (code không biên dịch được); prompt bài 2 ghi "cart rỗng ... không gọi shipping" nhưng reference khởi tạo shipping ngay từ đầu để chạy song song (mâu thuẫn); test timeout 2000 ms nhưng helper `await` chỉ chờ 3 s (dễ flaky); thiếu giải thích IO, MDC/ThreadLocal, CyclicBarrier, pipeline. | Đổi thành `p -> p + 1`; sửa prompt thành "không cộng phí ship" + giải thích shipping chạy song song, cart rỗng bỏ kết quả; nâng `await` lên 5 s; thêm giải thích thuật ngữ. |
| lesson-concurrency-017 | Ví dụ đời thực dùng `Semaphore(100)` nhưng 8.000 req/s × 3 lời gọi × 60 ms cần ~1.440 permit nên không thể đạt 8.000 req/s (mâu thuẫn số học); thiếu giải thích JEP, JFR, jcmd, JDBC, p99, throughput, native, heap, FIFO, daemon, ScopedValue; cần nói rõ JDK 24+ `jdk.VirtualThreadPinned` chỉ còn ghi pinning native/VM. | Đổi thành `Semaphore(1500)` kèm phép tính 8.000×3×0,06≈1.440; thêm giải thích thuật ngữ; ghi chú JFR JDK 24+. |
| lesson-concurrency-018 | Thiếu giải thích fail fast, starvation, throughput, token bucket, flaky, p99, 429/503. | Thêm giải thích ngắn ngay lần đầu xuất hiện. |

- Số bài học concurrency trước/sau: 18/18; số bài tập 5/5; số câu check 14/14 (không đổi id, không xoá mục).
- `node --check` OK; `node scripts/test-lessons.js` 296/296 (4 bài đã sửa biên dịch + chạy thật); `node scripts/build-light-index.js` + `node scripts/validate.js` → `OK — không có lỗi.`
- Giữ các chỉnh sửa hợp lệ từ lần chạy trước (nới timeout test lesson-016 từ 200 ms lên 2000 ms) và nâng thêm `await` lên 5 s để tránh flaky trên CI chậm.
- Sửa thêm lỗi chính tả/câu tối nghĩa trong explain: "ThreadPoolExecutor biet" → "bên trong" (015), "pool thứ rẻ" → "pool ảo" (017), "duoc duoc" → "duoc".
- Không commit.
Reviewed-by: kilo (T2149R)
