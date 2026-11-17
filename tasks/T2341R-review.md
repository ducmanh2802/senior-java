# T2341R — Fact-check nội dung mới của T2341

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2341 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-banking-011`: Sửa lỗi kỹ thuật bài tập/test khiến logic auth-expire và settle sai:
  - `tickDays` không thể hết hạn theo kịch bản test (chỉ dựa vào `clock.instant()` cố định mà Clock không thay đổi). Đổi sang mô hình thời gian cộng dồn nội bộ: thêm `currentTime` (bắt đầu từ `clock.instant()`), mỗi lần `tickDays` cộng dồn `currentTime` rồi so với `authTime + authValidityDays` để tự `EXPIRE` khi `>=` hạn (phù hợp yêu cầu "auth hết hạn sau N ngày với Clock cố định"). Cập nhật cả starter, reference, prompt và hint tương ứng.
  - Reference `apply(Event.SETTLE)` không gán `settledAmount`, khiến test `settledAmount = capturedAmount` fail. Bổ sung gán `settledAmount = capturedAmount` khi settle thành công.
  - Starter trước đó throw `UnsupportedOperationException("TODO")` làm test dừng sớm sau 2 case PASS, khiến parser (`total` fallback theo số case) coi starter "pass hết test" và `scripts/test-lessons.js` báo lỗi. Đổi stub thành phương thức rỗng (không throw) để starter biên dịch được, chạy hết test nhưng không pass.
- Sửa lỗi chính tả/spacing nhỏ: `issuer mở dispute qua scheme,merchant ...` → `scheme, merchant ...`; `(luồng ngượcmerchant->...)` → `(luồng ngược merchant->...)`.
- Chạy `node scripts/build-light-index.js` sau khi sửa nội dung lesson (file owned). Chạy `node --check js/data/lessons-banking.js` OK.
- Kiểm tra: `node scripts/test-lessons.js lesson-banking-011` → `Lesson exercises OK: 1/1`.
- `node scripts/validate.js`: còn lỗi `quiz-ccao-2.js: lỗi cú pháp/chạy: missing ) after argument list` (ngoài phạm vi file owned, có từ trước; không sửa). Không phát sinh lỗi/ cảnh báo mới từ `js/data/lessons-banking.js`.
