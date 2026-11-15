# T2131 — Thêm hình minh hoạ cho câu lõi trong q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2117

## Bối cảnh
Người học (dev Java ~4 năm, hổng nền tảng) cần đáp án **trực quan**. App giờ hiển thị đáp án thành các thẻ có icon; thiếu nhất là **hình**: sơ đồ luồng, bảng so sánh, sơ đồ ASCII.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-spring-data.js` → lấy các câu có `'core'` trong `tags` (task T2117 đã gắn). KHÔNG đọc cả file.
2. Với **tối đa 12 câu core** chưa có hình (không có `~~~seq`, không có bảng `|`, không có sơ đồ ASCII trong `~~~text`), thêm **đúng 1 hình** phù hợp nhất, đặt trong mục `###` liên quan (thường là mục cơ chế), kèm 1–2 câu dẫn "Hình dưới cho thấy…":
   - luồng nhiều bên (request → service → DB/Kafka, retry, transaction) → `~~~seq` theo cú pháp AGENTS.md mục 5 (2–6 actor, mỗi bước ≤ 60 ký tự);
   - so sánh 2–4 lựa chọn → bảng `| a | b |`;
   - cấu trúc bộ nhớ/dữ liệu/trạng thái → sơ đồ ASCII trong `~~~text` (≤ 15 dòng, rộng ≤ 70 ký tự).
   Gợi ý chủ đề hình: proxy @Transactional, vòng đời bean, persistence context/flush, N+1, isolation level.
3. Hình phải **đúng kỹ thuật** và khớp với chữ trong đáp án (tên, số liệu). Không sửa phần chữ khác, không xoá gì, không đổi id/q/follow.

## Luật
- Đọc AGENTS.md mục 4–6 (markup, bẫy backtick và `${`). Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task này được chèn hình vào đáp án có sẵn (chỉ chèn, không xoá). Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra cú pháp ~~~seq).
Xong: `Status: DONE`, Notes liệt kê id đã thêm hình và loại hình.

## Notes

Đã thêm đúng 1 hình cho 12 câu core chưa có hình (count câu trước/sau không đổi):
- spring-013: ~~~seq luồng lỗi tập trung @ControllerAdvice → ProblemDetail
- jpa-016: ~~~seq định tuyến primary/replica qua AbstractRoutingDataSource
- spring-024: bảng so sánh cách Spring chọn bean cùng kiểu (@Primary/@Qualifier/List/Map/tên)
- db-023: bảng 4 trường hợp B-tree bị bỏ qua (hàm, LIKE prefix/leading wildcard)
- spring-029: ~~~seq REQUIRES_NEW giữ 2 connection → cạn pool
- spring-030: ~~~text luồng đánh giá điều kiện auto-configuration
- jpa-022: ~~~text persistence context, snapshot, dirty checking khi flush
- jpa-023: ~~~seq luồng gây LazyInitializationException khi serializer đọc lazy
- jpa-024: ~~~seq optimistic lock @Version (2 request cùng version, thứ bị từ chối)
- jpa-025: bảng so sánh IDENTITY/SEQUENCE/pooled optimizer về gom batch
- jpa-026: ~~~text fetch join collection + LIMIT làm nhân row → HHH000104
- spring-039: ~~~seq pipeline vòng đời bean (BeanDefinition → proxy → singleton pool)

Kết quả: `node --check js/data/q-spring-data.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → "OK — không có lỗi."
Reviewed-by: kilo (T2131R)
