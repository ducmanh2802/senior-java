# T2433R — Fact-check nội dung mới của T2433

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2433 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- api-077: sửa lỗi trích dẫn — mã 422 Unprocessable Content trong RFC 9110 nằm ở mục **15.5.21** (Client Error 4xx), không phải 15.4.2 (15.4 là Redirection 3xx). Còn lại trong api-077 (máy trạng thái, ánh mã 409/403/404/422, SELECT FOR UPDATE, cập nhật có điều kiện, unique index hoàn tiền) đã kiểm tra: đúng.
- api-078: đã kiểm tra kỹ thuật (exponent ISO 4217 USD=2/VND=0, Currency.getDefaultFractionDigits, spring.jackson.generator.write-bigdecimal-as-plain, write-dates-as-timestamps mặc định tắt ở Boot 3, RFC 7396 null = xoá field): không sai kiến thức, không cần sửa.
- api-079: đã xác nhận lại mã sinh UUIDv7 theo RFC 9562 (timestamp bits 0-47, version 7 bits 48-51, rand_a 52-63, variant 10 bits 64-65, rand_b 66-127): mã Java hiện tại đúng bit-position, không cần sửa.
- api-080: phân loại breaking/additive, RFC 8594 Deprecation/Sunset, tolerant reader, pipeline Spectral + openapi-diff + Pact: đúng kiến thức, không cần sửa.

node scripts/validate.js → không báo lỗi nào về js/data/q-api.js.
