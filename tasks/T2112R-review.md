# T2112R — Fact-check nội dung mới của T2112

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2112 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung MỚI của T2112 (lesson-microservices-016 và 017, 542 dòng thêm). Không sửa code/bài tập: starter + reference + tests của cả hai bài đều biên dịch và pass 6/6 (`node scripts/test-lessons.js lesson-microservices-016`, `-017`).

### lesson-microservices-016 — lỗi đã sửa
1. `### Cơ chế từng bước` mục 3 **nói ngược cơ chế**: mô tả HALF_OPEN quyết định theo *tỉ lệ lỗi* ("tỉ lệ lỗi vượt ngưỡng → OPEN, dưới ngưỡng → CLOSED"), trong khi `RateBreaker` (code trong body, starter, reference, tests) đếm **số probe thành công** (`halfOpenSuccessThreshold` → CLOSED) và **một probe lỗi là OPEN ngay**. Sửa lại theo đúng code, và ghi rõ Resilience4j làm khác: chờ đủ `permittedNumberOfCallsInHalfOpenState` probe rồi mới so tỉ lệ lỗi (một probe lỗi đơn lẻ chưa mở mạch ngay).
2. `### Liên hệ phỏng vấn` câu "Trong HALF_OPEN, nếu một probe lỗi thì sao?" khẳng định "không chờ hết số probe" như hành vi chung → sai với Resilience4j / Spring Cloud Circuit Breaker (đối tượng người đọc dùng Spring Boot 3.x). Sửa thành nêu đúng cả hai mô hình.
3. `check` câu 3 ("sau bao nhiêu probe mới quyết định về OPEN hay CLOSED?") có đáp án B mô tả cơ chế tỉ lệ lỗi, không khớp code của bài → viết lại options/explain theo mô hình success-count của bài, có ghi chú Resilience4j (đáp án vẫn B).
4. `exercises[0].explain` nói các thông số "ánh xạ 1-1 sang Resilience4j", nhưng `halfOpenSuccessThreshold` không tồn tại trong Resilience4j → sửa thành ánh xạ đúng các tham số + nêu rõ khác biệt ở HALF_OPEN.
5. `Cơ chế từng bước` mục 2 dùng tên biến không tồn tại `{{openDuration}}` (code dùng `openMs`) → sửa thành `{{openMs}}`.

### lesson-microservices-017 — lỗi đã sửa
1. "Mỗi breaker có failureThreshold, openMs riêng" sai với code: `BreakerRegistry` dùng **chung** một `failureThreshold`/`openMs` cho mọi tên → sửa thành "mỗi breaker có trạng thái và bộ đếm riêng, cấu hình dùng chung; Resilience4j cho phép cấu hình riêng từng instance".
2. "nếu chưa có thì tạo mới với cấu hình của dependency đó" → cell mới không có cấu hình riêng; sửa thành tạo mới (CLOSED, bộ đếm 0).
3. Ví dụ đời thực ghi "threshold 0,5" (kiểu tỉ lệ) trong khi code đếm **số lỗi liên tiếp** → sửa thành "ngưỡng 2 lỗi liên tiếp, mở 10s".

### Nghiệm thu
- `node --check js/data/lessons-microservices.js` → OK.
- `node scripts/test-lessons.js lesson-microservices-016` → 6/6; `lesson-microservices-017` → 6/6.
- `node scripts/validate.js`: file này **0 lỗi markup/schema**; 34 dòng còn lại đều là `related "microservices-0xx" không phải id câu hỏi có thật` do `js/data/q-microservices.js` đang bị task khác viết dở (lỗi cú pháp, 0 câu hỏi) — ngoài phạm vi T2112R. Kiểm chứng trong bản copy tạm dùng `q-microservices.js` ở HEAD (87 câu hỏi): `validate.js lessons-microservices.js` không còn lỗi nào của file này (chỉ còn staleness `index-light.js`, cũng không thuộc file này). `js/data/index-light.js` đã có sẵn lesson-microservices-016/017.
- Không sửa nội dung ở HEAD, không thêm/xoá mục, không sửa file khác.
