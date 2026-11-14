# T2024R — Fact-check nội dung mới của T2024

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2024 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-concurrency-016` (bài mới, T2024) — exercise 1 "Ba nguồn giá song song: timeout, fallback và không chặn thread gọi":
  - `reference`: đổi `.completeOnTimeout(null, timeoutMs, TimeUnit.MILLISECONDS)` thành `.orTimeout(timeoutMs, TimeUnit.MILLISECONDS)` (đặt trước `.exceptionally(ex -> null)`) để nguồn quá giờ hoàn thành với `TimeoutException` rồi được `exceptionally` chuyển thành `null`. Cách cũ dùng `completeOnTimeout` không ổn định/đúng với case timeout trong test (test "nguồn chậm bị bỏ sau timeout" với `[130, slow(1,5000), 125]` timeout 200ms kỳ vọng 125) — `node scripts/test-lessons.js lesson-concurrency-016` cho reference FAIL trước khi sửa, PASS 7/7 sau khi sửa.
  - `explain`: cập nhật đoạn "Thứ tự quan trọng" và mục "Lỗi hay gặp" tương ứng (`orTimeout` phải đứng trước `exceptionally`, nếu đặt `exceptionally` trước thì timeout phát sinh sau sẽ không được bắt; `completeOnTimeout(null,...)` chỉ phù hợp khi muốn giá trị mặc định mà không cần phân biệt nguyên nhân). Nội dung lý thuyết (body/check) về `orTimeout`/`completeOnTimeout` và lưu ý "chỉ điền hộp, không dừng việc bên dưới" đã đúng, giữ nguyên.
- Đã chạy `node scripts/build-light-index.js` (sinh lại `js/data/index-light.js`), `node --check js/data/lessons-concurrency.js`, `node scripts/test-lessons.js lesson-concurrency-016` → 2/2 exercises OK, `node scripts/validate.js` → OK (không có lỗi; chỉ còn warning PATH sẵn có về các bài chưa nằm trong PATH, bao gồm `lesson-concurrency-016`).
- Không git commit/push. Không sửa file ngoài ownership (trừ cập nhật task file và rebuild index-light bắt buộc).
