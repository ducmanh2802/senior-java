# T2132 — Thêm hình minh hoạ cho câu lõi trong q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2120

## Bối cảnh
Người học (dev Java ~4 năm, hổng nền tảng) cần đáp án **trực quan**. App giờ hiển thị đáp án thành các thẻ có icon; thiếu nhất là **hình**: sơ đồ luồng, bảng so sánh, sơ đồ ASCII.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-microservices.js` → lấy các câu có `'core'` trong `tags` (task T2120 đã gắn). KHÔNG đọc cả file.
2. Với **tối đa 12 câu core** chưa có hình (không có `~~~seq`, không có bảng `|`, không có sơ đồ ASCII trong `~~~text`), thêm **đúng 1 hình** phù hợp nhất, đặt trong mục `###` liên quan (thường là mục cơ chế), kèm 1–2 câu dẫn "Hình dưới cho thấy…":
   - luồng nhiều bên (request → service → DB/Kafka, retry, transaction) → `~~~seq` theo cú pháp AGENTS.md mục 5 (2–6 actor, mỗi bước ≤ 60 ký tự);
   - so sánh 2–4 lựa chọn → bảng `| a | b |`;
   - cấu trúc bộ nhớ/dữ liệu/trạng thái → sơ đồ ASCII trong `~~~text` (≤ 15 dòng, rộng ≤ 70 ký tự).
   Gợi ý chủ đề hình: saga, outbox, circuit breaker, Kafka partition/consumer group, retry/timeout giữa service.
3. Hình phải **đúng kỹ thuật** và khớp với chữ trong đáp án (tên, số liệu). Không sửa phần chữ khác, không xoá gì, không đổi id/q/follow.

## Luật
- Đọc AGENTS.md mục 4–6 (markup, bẫy backtick và `${`). Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task này được chèn hình vào đáp án có sẵn (chỉ chèn, không xoá). Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra cú pháp ~~~seq).
Xong: `Status: DONE`, Notes liệt kê id đã thêm hình và loại hình.

## Notes

Tổng 37 câu core trong `js/data/q-microservices.js`. Các câu khác đã có hình (`~~~seq`/`~~~text`/bảng). Chỉ thêm 1 bảng so sánh cho 2 câu chưa có hình, không xoá hay đổi chữ khác, số câu không đổi (37/37):
- `microservices-019`: bảng so sánh 3 cơ chế rebalance (Eager, Cooperative Sticky, Static membership) tại mục "Consumer rebalance - điều làm lag nhảy".
- `microservices-020`: bảng so sánh 2 chế độ retry (Blocking vs Non-blocking retry) tại mục sau "Ordering khi retry".

Xác nhận: `node --check js/data/q-microservices.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → "OK — không có lỗi."
Reviewed-by: kilo (T2132R)
