# T138R — Fact-check nội dung mới của T138

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T138 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới của T138 (3 bài `lesson-api-001..003`), đối chiếu RFC 9110/9112/8259/9457, Spring Boot 3 docs và tài liệu Stripe. Sửa trực tiếp các lỗi sau (không thêm/xoá mục, không đổi starter/tests logic):

**lesson-api-001**
- Sửa số liệu ví dụ: `Content-Length: 31` → `29` (body `{"amount":100000,"ccy":"VND"}` đúng 29 byte); trong test của exercise cũng sửa `Content-Length: 19` → `18` (`amount=100&ccy=VND` = 18 ký tự). Dù test không validate Content-Length, số sai vẫn là nội dung sai.
- "Ba điểm dễ sai" nhưng liệt kê 4 ý → sửa thành "Bốn điểm".
- Lỗi cơ chế hoa/thường: văn bản cũ nói `application/json` khác `Application/JSON` — sai, type/subtype trong media type **không** phân biệt hoa thường (RFC 9110 §8.3 "The type and subtype tokens are case-insensitive"). Sửa lại: giá trị header phân biệt hoa thường trừ khi chuẩn định nghĩa ngược (ngoại lệ Content-Type), ví dụ đúng là `X-Trace: Abc` vs `abc`.
- "Chuẩn cũ dùng CRLF" → RFC 9112 **vẫn** quy định CRLF, LF trần chỉ là thực tế client gửi; diễn đạt lại đúng.
- "Nếu server nhận cả hai Content-Length và Transfer-Encoding **phải** từ chối 400" → quá cứng so với chuẩn: RFC 9112 §6.1 là "server MAY reject hoặc xử lý theo TE"; §6.3 nói message "ought to be handled as an error" và MUST đóng kết nối. Sửa lại đúng mức: khuyến nghị coi là lỗi, thường từ chối 400 và đóng kết nối.
- "JSON chuẩn là UTF-8, nhưng ghi rõ charset giúp tránh lỗi với client cũ" → RFC 8259 **không** định nghĩa charset cho `application/json`; sửa lại: charset=utf-8 không phải bắt buộc nhưng vô hại với client cũ.
- Bảng method/status, directive cache, ETag/If-Match, 405 + Allow (RFC 9110 MUST), 401 + WWW-Authenticate, RFC 9457: giữ nguyên — đã đúng.

**lesson-api-002**
- Không phát hiện lỗi kỹ thuật: RFC 9457 (`application/problem+json`, type/title/status/instance) đúng; `spring.mvc.problemdetails.enabled=true`, `ProblemDetail`/`ErrorResponseException`, `MethodArgumentNotValidException` đều có thật trong Spring Boot 3 / Framework 6; 405 kèm `Allow`, ranh giới 400/422, 410/412/422 đúng. Exercise router pass 7/7, `related` (api-003/006/018) đều tồn tại trong `q-api.js`.

**lesson-api-003**
- Bỏ claim "Stripe trả 400" (không kiểm chứng được trong docs Stripe) → thay bằng "400/409/422 tuỳ hợp đồng; Stripe dùng lỗi `idempotency_error`" (đã đối chiếu docs.stripe.com: `idempotency_error` = key re-used với endpoint/parameters khác; bảng HTTP status của Stripe nêu 409 Conflict "perhaps due to using the same idempotent key").
- Bảng hợp đồng: hàng "body khác" đổi sang "409 hay 422"; hàng "request đang chạy" bỏ "(Stripe)" vì không xác nhận được Stripe dùng đúng cụm "in progress".
- Sửa đoạn fingerprint: văn bản cũ nói canonicalize JSON là hướng sai ("khác byte lại coi là giống nhau — phức tạp không cần thiết") — thực tế Stripe canonicalize parameters. Sửa thành so sánh hai lựa chọn (hash raw body vs canonicalize) và khuyến nghị nhất quán.
- Lỗi markup/syntax: `{{String, FutureTask>}}` (thiếu chữ M, vỡ generics) → `{{Map<String, FutureTask>}}`.
- Explain câu check PUT: "không tự idempotent nếu server sinh ID mới" → PUT theo chuẩn luôn là idempotent, server sinh ID mới mỗi lần là **vi phạm** hợp đồng; sửa diễn đạt đúng nghĩa.

Ngoài ra: không có chữ nước ngoài lẫn lộn, không backtick/`${` phá template literal, mọi `related` đều trỏ id có thật, không sửa nội dung nào của HEAD (file ở HEAD chỉ là `push(...)` rỗng).

Nghiệm thu:
- `node --check js/data/lessons-api.js` → OK
- `node scripts/test-lessons.js lesson-api-001|002|003` → reference pass 100% (6/6, 7/7, 6/6), exit 0
- `node scripts/validate.js` → `OK — không có lỗi.` (exit 0; các warning còn lại thuộc `q-english.js` của task khác)
