# T2518R — Fact-check nội dung mới của T2518

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

## Notes

**Bối cảnh:** Nội dung T2518 (2 bài Kafka `lesson-microservices-023`, `024`) được T2518 viết vào file tạm `append_lessons.js` nhưng **chưa từng được append vào `js/data/lessons-microservices.js`** (lần chạy T2518 bị gián đoạn; HEAD và working tree chỉ có tới bài 022). Đã khôi phục nội dung (append 023/024 vào đúng file sở hữu), fact-check và sửa lỗi; validate OK; test-lessons 023 và 024 đều pass 5/5.

**Lỗi đã sửa theo từng id:**

`lesson-microservices-023`
1. Seq sai cú pháp: `note Consumer-0,Consumer-1:` (dấu phẩy bị hiểu thành một actor ma) → `note Consumer-0..Consumer-1:`.
2. Inline code lồng dấu `{ }`: `{{echo '{"id":1}' | docker exec …}}` → chuyển 3 lệnh docker sang code block `~~~bash` (tránh vỡ markup).
3. Kiến thức sai: "CooperativeStickyAssignor (mặc định Kafka 2.4+)" → **không** phải mặc định (mặc định vẫn là RangeAssignor; có từ Kafka 2.4, KIP-429).
4. Bài tập compile error: `part()` khai báo trả `Map<Integer,List<Record>>` nhưng thực tế trả `List<Record>` → sửa kiểu trả về.
5. Test "range assignor" sai logic: bắt `c0` khi consumer đứng một mình (một mình phải đọc cả 3 partition `[0,1,2]`) nhưng lại so sánh với `[0,1]` → viết lại dùng re-join để kiểm tra assignment sau rebalance.
6. `check` có 5 câu (validator yêu cầu 2–4) → rút còn 4 (bỏ câu idempotent vì đã có ở `lesson-microservices-002` và câu commit offset).

`lesson-microservices-024`
1. Seq sai cú pháp: dòng `loop records` / `end` không hợp lệ → gộp thành 1 dòng message `send(transform(record)) cho mỗi record`.
2. Số liệu sai: "transaction.timeout.ms (mặc định 1h)" → mặc định **60s (1 phút)**, tối đa theo `transaction.max.timeout.ms` mặc định 15 phút.
3. "Set transaction.timeout.ms 10-30 phút" → 5-15 phút (≤ `transaction.max.timeout.ms` 15 phút, nếu không broker từ chối).
4. Số liệu vô căn cứ: "read_committed latency ~transaction.timeout.ms/2" (2 chỗ) → giải thích đúng theo Last Stable Offset (LSO), độ trễ phụ thuộc thời gian transaction.
5. Cơ chế nói ngược: "Coordinator … gán partition cho từng member" → **leader (client) mới chạy assignor để tính assignment**; coordinator chỉ gửi danh sách member + metadata trong JoinGroupResponse.
6. Code mẫu sai API: `consumer.subscribe(...)` rồi `consumer.assign(...)` cùng lúc (ném `IllegalStateException`) → chỉ giữ `subscribe`.
7. `check` có 5 câu → rút còn 4.

**Nghiệm thu:**
- `node scripts/validate.js` → **OK — không có lỗi.** (đã chạy `node scripts/build-light-index.js` sinh lại index-light.js)
- `node scripts/test-lessons.js lesson-microservices-023` → 5/5 pass; `lesson-microservices-024` → 5/5 pass.
- Full suite `node scripts/test-lessons.js` → 349/350; bài duy nhất còn fail là `lesson-sql-018` (thuộc `js/data/lessons-sql.js`, task T2516 đang chạy song song, **ngoài phạm vi sở hữu của task này**).

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2518 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
