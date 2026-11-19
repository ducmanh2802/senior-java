# T2433 — 4 câu hỏi Senior Java (api) vào q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2382

Thêm **4 câu hỏi phỏng vấn mới** (topic: api) vào `js/data/q-api.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-api.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: API & data contract: thiết kế REST cho tài nguyên có vòng đời (task/order) và hành động (POST /orders/{id}/cancel), versioning, pagination cursor, error model (RFC 9457 problem details), idempotency-key header, OpenAPI contract-first và consumer-driven contract test.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu vào `js/data/q-api.js` (id nối tiếp, file từ 76 lên 80 câu; không sửa mục cũ):

- `api-077` (senior, 7724 ký tự) — vòng đời đơn hàng: vì sao không cho client PATCH status, endpoint hành động `POST /orders/{id}/cancel`, bảng transition, 409/422/403/404, chống race bằng `SELECT FOR UPDATE` và conditional update, idempotent theo trạng thái đích.
- `api-078` (senior, 6616) — data contract trên wire: tiền dạng string decimal + ISO 4217, thời gian ISO-8601/Instant, tiến hoá enum + tolerant reader, field lạ (hai chiều), null vs vắng mặt (RFC 7396), không serialize entity.
- `api-079` (lead, 6514) — hợp đồng định danh: id nội bộ vs public id, so sánh bigint/UUIDv4/UUIDv7/ULID/Snowflake, tự sinh UUIDv7 (RFC 9562) trong Java 17, migration song song + Sunset (RFC 8594), IDOR không được sửa bằng UUID.
- `api-080` (lead, 5902) — governance contract: phân loại additive vs breaking (kể cả thêm enum value và siết validation), pipeline Spectral + openapi-diff + Pact can-i-deploy, waiver có hạn, ngân sách version, tolerant reader phía client.

Nghiệm thu: `node --check js/data/q-api.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` **không còn lỗi nào thuộc `q-api.js`** (2 lỗi còn lại thuộc file ngoài quyền sở hữu: `quiz_backup.js` untracked không khai báo trong data-manifest, và `labs-sql.js` lỗi cú pháp của T2422 đang dở — đúng luật 3 nên không sửa). Không commit.

Ghi chú kỹ thuật đã kiểm: không backtick, không `${`; inline code không còn dấu `{ }` lồng; mỗi câu có `**Tóm tắt:**`, code Java ≤ 30 dòng có comment, bảng trade-off, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, 3 câu `follow`.
Reviewed-by: kilo (T2433R)
