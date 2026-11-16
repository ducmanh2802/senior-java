# T2195 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2134

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-concurrency-jvm.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

- Đã rà soát 15 câu KHÔNG có tag `core`, id lớn nhất (theo số thứ tự id, tiebreak chuỗi id giảm dần):
  `concurrency-078, concurrency-077, concurrency-076, concurrency-075, concurrency-074, concurrency-073, concurrency-072, concurrency-071, concurrency-070, concurrency-069, jvm-069, concurrency-068, jvm-068, jvm-067, jvm-066`.
  (Vì `concurrency-066` và `jvm-066` đồng hạng 66, đã rà soát thêm `concurrency-066` cho chắc.)
- Đã kiểm chứng vài hành vi bằng JDK 17 thật (không chỉ suy luận): `CompletableFuture.allOf` chỉ hoàn tất **sau khi mọi nhánh xong** kể cả khi một nhánh lỗi (nên mô tả trong concurrency-073 là đúng); `LockSupport.park()` **không ném, không xoá cờ** interrupt (xác nhận concurrency-071 chỗ sai); `Phaser` dùng **hai hàng đợi `evenQ`/`oddQ` chứa `QNode`** (không phải "treap" như concurrency-069 ghi).
- Đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không thấy API/flag/giá trị mặc định bịa (đã sửa 1 con số bịa ở concurrency-068). Đủ `**Tóm tắt:**`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` cho cả 15 câu. Không có backtick/`${` trong template literal.
- Số mục không đổi: 146 câu trước và sau (không xoá/đổi id).
- Trùng ý (có chủ đích, khác góc độ, không sửa): `concurrency-066` ↔ `concurrency-072` (LongAdder/Striped64); `concurrency-073` ↔ `concurrency-078` (allOf/anyOf); `concurrency-077` ↔ `jvm-058` (structured concurrency + ScopedValue); `concurrency-076` ↔ `jvm-058` (context propagation / ScopedValue).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| concurrency-066 | Bảng ghi LongAdder "Chính xác khi đọc (sum)" — sai vì `sum()` không phải ảnh chụp nguyên tử; pitfall "các cell tích lũy vô hạn, reset giải phóng bộ nhớ" — sai (cell có giới hạn theo mức tranh chấp, `reset()` chỉ đưa giá trị về 0, không nhả cell) | Sửa ô bảng thành "Gần đúng khi đọc (sum), không phải ảnh chụp nguyên tử"; viết lại pitfall: `reset()`/`sumThenReset()` không nguyên tử với `increment()` (mất số đếm) và không giải phóng bộ nhớ |
| concurrency-068 | Con số bịa: "fair=true làm throughput giảm khoảng 10–30%" (không có cơ sở, đây là quy tắc chung chứ không phải ví dụ) | Bỏ con số, giữ nguyên ý "làm giảm throughput" |
| concurrency-069 | Phaser mô tả dùng "một cây (treap) các node chờ" — sai; JDK dùng hai hàng đợi `evenQ`/`oddQ` chứa `QNode` | Sửa thành "hai hàng đợi (even/odd) chứa các node đang chờ, để đánh thức theo đúng pha" |
| concurrency-071 | Bảng "interrupt có tác dụng không" gộp `LockSupport.park` vào hàng "ném InterruptedException" — sai; `park()` không ném, trả về sớm và giữ cờ true (sơ đồ phía trên đã mô tả đúng) | Tách `LockSupport.park` thành hàng riêng: "Không ném; park trả về sớm và cờ vẫn true — kiểm tra isInterrupted() sau khi park" |
| concurrency-076 | `ScopedValue` ghi "chính thức JDK 24, JEP 481" — sai (JEP 481 là bản preview JDK 24; chính thức ở JDK 25 là JEP 506); bảng lặp lại "cần JDK 24" | Sửa thành "preview từ Java 21–24, chính thức từ JDK 25 qua JEP 506" và bảng đổi thành "chính thức từ JDK 25 (JEP 506)" |
| concurrency-070, 072, 073, 074, 075, 077, 078, jvm-066, jvm-067, jvm-068, jvm-069 | Không phát hiện lỗi kỹ thuật | Không sửa (giữ nguyên) |
Reviewed-by: kilo (T2195R)
