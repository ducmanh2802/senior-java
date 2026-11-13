# T1603R — Fact-check nội dung mới của T1603

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1603 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Lần review này phát hiện và sửa **2 lỗi kỹ thuật thật** trong nội dung MỚI (bản trước ghi "không có lỗi" là thiếu chính xác):
  - **lesson-testing-008** — `OrderService` trong body gọi `pay.message()` nhưng `PaymentResult` (định nghĩa trong bài: `record PaymentResult(String status, String transactionId)`) **không có method `message()`** → đây là method bịa, sẽ không compile nếu tách ra. Đã sửa thành `pay.status()` (đúng như starter/reference).
  - **lesson-testing-009** — ghi "UTC+7 co dinh tu **1968**". Kiểm chứng bằng JS `Intl`/`Date` (Asia/Ho_Chi_Minh): tháng 6/1968 VN còn **UTC+8**, đến 6/1975 mới chuyển **UTC+7**. Đã sửa thành **1975** (đúng sự thật lịch sử; ý chính "VN không có DST" vẫn đúng).
- Sau khi sửa: `node --check js/data/lessons-testing.js` → PARSE OK; `node scripts/validate.js` → **không có lỗi nào thuộc về `lessons-testing.js`**.
- `node scripts/test-lessons.js lesson-testing-008` → reference pass 7/7, starter không pass.
- `node scripts/test-lessons.js lesson-testing-009` → reference pass 6/6, starter không pass.
- `node scripts/test-lessons.js` (toàn bộ) → Lesson exercises OK: 251/251 (9 bài học testing, 9 bài tập).
- Đã kiểm tra kỹ phần còn lại của nội dung MỚI (fake repository upsert/index, stub gateway route theo `orderId`, mock publisher trả copy `new ArrayList<>(events)`, refresh token max age + sliding window, `refreshTokenNewExpiry = min(lastUsed+7, issued+30)`, promotion `[startAt, endAt)` end-exclusive, rate limiter prune `now - window`, DST gap 29/3/2026 Europe/Paris) → kỹ thuật đúng. `related` và `tags` đều tham chiếu id có thật.
- **Blocker ngoài phạm vi (ghi để integrator biết, KHÔNG tự sửa vì law #3)**: `node scripts/build-light-index.js` crash do **`q-concurrency-jvm.js` lỗi cú pháp** (`SyntaxError: Invalid or unexpected token`) → không sinh được `index-light.js`, nên `validate.js` vẫn báo `index-light.js: đã cũ`. Đây là file của task khác (T1603 mới thêm, có lỗi cú pháp), không thuộc `lessons-testing.js`; cần task sở hữu `q-concurrency-jvm.js` sửa cú pháp rồi chạy lại `build-light-index.js`.
