# T364 — REST API: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`

Thêm **8 câu** topic api, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- Chọn status code đúng cho từng tình huống (201, 204, 400, 409, 422…)
- Phân trang offset vs cursor từ góc nhìn API
- Validation với Bean Validation và trả lỗi chuẩn RFC 9457 (Problem Details)
- Idempotency của PUT/PATCH/DELETE và Idempotency-Key cho POST
- Versioning API và giữ tương thích ngược
- ETag và conditional request (If-None-Match, If-Match)
- CORS hoạt động thế nào và vì sao hay lỗi
- Upload/download file qua REST: multipart, streaming, presigned URL

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes

- Đã thêm **8 câu** (chỉ thêm, không sửa nội dung cũ), id `api-023` … `api-030`; file giờ có 30 câu topic `api`.
- Phân bổ level: mid 5 (023–027), senior 2 (028, 029), lead 1 (030) ≈ 60/30/10 theo yêu cầu.
- Chủ đề (đã grep chống trùng với 22 câu cũ và các `js/data/q-*.js` khác — 7/8 gợi ý của task đã có sẵn trong file nên lấy góc mới, chỉ mục "upload/download file" là trống hoàn toàn):
  1. `api-023` (mid) — Upload file: multipart/form-data, boundary, giới hạn 3 tầng (nginx `client_max_body_size`, `spring.servlet.multipart`, quota), magic bytes, stream `getInputStream()`, presigned URL/PUT + `content-length-range`.
  2. `api-024` (mid) — Download file lớn: `InputStreamResource` vs `byte[]` (số liệu OOM), `Content-Disposition` UTF-8, `Content-Length`, HTTP Range/If-Range/206, proxy idle timeout, presigned GET + CDN.
  3. `api-025` (mid) — Bean Validation nâng cao: custom annotation `@ValidVietnamPhone` + `ConstraintValidator`, groups Create/Update, cascade/nested + container element, MethodValidation, tách lỗi format (400/422) vs nghiệp vụ (409/422) kèm sơ đồ race unique constraint.
  4. `api-026` (mid) — Cache-Control cho API: no-store/no-cache/private/public, ETag + `checkNotModified` → 304, chọn directive theo loại dữ liệu, 3 tầng (trình duyệt/proxy/CDN), `Vary` chống lộ cache.
  5. `api-027` (mid) — Content negotiation: `Accept` + q, `HttpMessageConverter`, 406, `Accept-Language`/`MessageSource`, `Accept-Encoding` + `Vary`, nén kép.
  6. `api-028` (senior) — JSON Merge Patch (RFC 7396) vs JSON Patch (RFC 6902): media type, JSON Pointer, idempotency, code áp merge đệ quy + `If-Match`/412.
  7. `api-029` (senior) — Real-time: polling + ETag vs SSE vs WebSocket (bảng so sánh), `SseEmitter`, `Last-Event-ID`, heartbeat/buffering, multi-instance cần sticky/Pub-Sub.
  8. `api-030` (lead) — Giữ tương thích ngược: tolerant reader/writer, bảng quyết định thay đổi, cấu hình Jackson/`@JsonEnumDefaultValue`, vòng đời field, contract test golden file + N-2.
- Mỗi câu đủ khung bắt buộc: `**Tóm tắt:**` → `### Hiểu nhanh` (ví dụ đời thường) → `### Thuật ngữ` → `### Cơ chế từng bước` (có "Vì sao", ASCII/số liệu) → code ngắn có comment → bảng trade-off → `### Lỗi hay gặp` → `### Trả lời miệng 1 phút` → `> Senior tip:`; `follow` 3 câu, có `tags`.
- Không dùng `refs` nên không cần check-links; riêng `node scripts/check-links.mjs q-api.js` đã chạy thử: 5 link (của 2 câu cũ) — hỏng 0.
- Kiểm chứng: `node --check js/data/q-api.js` OK; `node scripts/validate.js` → **OK — không có lỗi.** (không sửa file nào ngoài `js/data/q-api.js`, không commit).

Reviewed-by: claude (subagent fact-check; validate OK)
