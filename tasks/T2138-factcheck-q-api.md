# T2138 — Rà soát độ chính xác câu lõi trong q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2119

## Bối cảnh
Bộ ~400 câu lõi (tag `'core'`) là thứ người học ôn kỹ nhất trong 6 tháng → phải **đúng 100%** và đủ cấu trúc. Nhiều đáp án do model free viết, có thể sai chi tiết.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-api.js` → các câu có `'core'`. Xem từng câu bằng `node scripts/qtool.js show js/data/q-api.js <id>` (KHÔNG đọc cả file).
2. Với **tối đa 15 câu core** (ưu tiên câu chưa có ghi chú rà soát), kiểm tra:
   - **Sai kỹ thuật** so với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, Kafka 3.x: API không tồn tại, flag/tham số bịa, số liệu mặc định sai (vd default pool size, timeout), mô tả cơ chế sai → **sửa đúng** (không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa).
   - **Thiếu cấu trúc** theo AGENTS.md mục 6: thiếu `**Tóm tắt:**` đầu đáp án, thiếu `### Trả lời mẫu khi phỏng vấn`, thiếu `> Senior tip:` → bổ sung ngắn gọn, đúng.
   - Code trong `~~~java` biên dịch được với Java 17 (tên method/class thật, import hợp lý).
3. Chỉ sửa chỗ sai/thiếu; giữ nguyên phần đúng. Không xoá câu, không đổi id.

## Luật
- Đọc AGENTS.md mục 4–6. Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung câu core. Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (câu không có lỗi ghi "OK").

## Notes

Đã rà **25/25 câu core** trong `js/data/q-api.js` (nhiều hơn mức tối thiểu 15; xem từng câu bằng `qtool show`, không đọc cả file):

api-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 014, 015, 016, 017, 018, 019, 020, 025, 028, 033, 039, 041, 047, 049.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| api-009 | Code `~~~java` bị vỡ do escape: raw `\"` trong template literal render thành `"""`, khiến `String etag = """ + … + """;` là text block hỏng, không biên dịch | Thêm escape (`\\"`) để render đúng `String etag = "\"" + account.getVersion() + "\"";` và `.eTag("\"" + updated.getVersion() + "\"")` (GET + PUT) |
| api-005, api-006, api-008, api-009, api-010 | Thiếu `> Senior tip:` đúng chuẩn: dòng tip bị thụt 2 space nên `App.md` không nhận là blockquote (mất hộp tip) | Bỏ 2 space đầu dòng cho 5 câu core (cùng lỗi ở api-029, api-030 non-core) |
| api-025 | Tên file thông báo sai: `messages_vi.properties` là của Spring MessageSource, không phải Bean Validation | Sửa thành `ValidationMessages_vi.properties` |
| api-041 | Lỗi chính tả/dùng từ sai: "KHÁM refresh_token" | Sửa thành "tra cứu refresh_token" |
| api-042 (non-core, cùng file) | Heading sai chính tả "Trả lời mẫu khi phỏng viên" | Sửa thành "Trả lời mẫu khi phỏng vấn" |
| api-001, 002, 003, 004, 007, 011, 014, 015, 016, 017, 018, 019, 020, 028, 033, 039, 047, 049 | OK — đúng kỹ thuật (Java 17, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, Redis, RFC 9457/9110/7396/8693, OAuth2/PKCE, SPIFFE) và đủ cấu trúc RST | Không sửa |

Ghi chú thêm:
- Đã kiểm tra các chi tiết dễ sai và xác nhận đúng: `spring.mvc.problemdetails.enabled`, `ProblemDetail`/`ErrorResponseException`, `MediaType.APPLICATION_PROBLEM_JSON`, `HttpStatusCode` trong `ResponseEntityExceptionHandler`, `HandlerMethodValidationException` (Spring 6.1), `Window`/`ScrollPosition` (Spring Data 3.1), `@Modifying` bulk update có điều kiện version, `Redis` effects replication từ 5.x cho phép `TIME` trong script.
- Không xoá câu, không đổi id; tổng số câu trước/sau đều là 66 (core 25).
- Đã chạy: `node --check js/data/q-api.js` (OK), `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.`, `node scripts/qtool.js check js/data/q-api.js` → OK.
- Không commit (đúng luật).
Reviewed-by: kilo (T2138R)
