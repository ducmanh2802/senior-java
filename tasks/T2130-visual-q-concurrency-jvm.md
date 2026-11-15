# T2130 — Thêm hình minh hoạ cho câu lõi trong q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2116

## Bối cảnh
Người học (dev Java ~4 năm, hổng nền tảng) cần đáp án **trực quan**. App giờ hiển thị đáp án thành các thẻ có icon; thiếu nhất là **hình**: sơ đồ luồng, bảng so sánh, sơ đồ ASCII.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-concurrency-jvm.js` → lấy các câu có `'core'` trong `tags` (task T2116 đã gắn). KHÔNG đọc cả file.
2. Với **tối đa 12 câu core** chưa có hình (không có `~~~seq`, không có bảng `|`, không có sơ đồ ASCII trong `~~~text`), thêm **đúng 1 hình** phù hợp nhất, đặt trong mục `###` liên quan (thường là mục cơ chế), kèm 1–2 câu dẫn "Hình dưới cho thấy…":
   - luồng nhiều bên (request → service → DB/Kafka, retry, transaction) → `~~~seq` theo cú pháp AGENTS.md mục 5 (2–6 actor, mỗi bước ≤ 60 ký tự);
   - so sánh 2–4 lựa chọn → bảng `| a | b |`;
   - cấu trúc bộ nhớ/dữ liệu/trạng thái → sơ đồ ASCII trong `~~~text` (≤ 15 dòng, rộng ≤ 70 ký tự).
   Gợi ý chủ đề hình: thread state, lock/happens-before, thread pool + queue, vùng nhớ JVM, các pha GC.
3. Hình phải **đúng kỹ thuật** và khớp với chữ trong đáp án (tên, số liệu). Không sửa phần chữ khác, không xoá gì, không đổi id/q/follow.

## Luật
- Đọc AGENTS.md mục 4–6 (markup, bẫy backtick và `${`). Không backtick, không `${` trong template literal.
- Ngoại lệ cho luật "chỉ thêm": task này được chèn hình vào đáp án có sẵn (chỉ chèn, không xoá). Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra cú pháp ~~~seq).
Xong: `Status: DONE`, Notes liệt kê id đã thêm hình và loại hình.

## Notes
- Quét 55 câu có tag `'core'`: **50 câu đã có hình** (bảng `|` hoặc sơ đồ ASCII trong `~~~text`) → không thêm để tránh trùng. Chỉ 5 câu chưa có sơ đồ, đã thêm đúng 1 hình/câu (chỉ chèn, không xoá chữ nào; số câu trước/sau: **146 → 146**):
  - `concurrency-005` — **bảng** so sánh thenApply / thenCompose / thenCombine (kiểu lambda, kết quả, khi nào dùng, dùng sai) trong mục "thenApply vs thenCompose".
  - `concurrency-018` — **sơ đồ ASCII** hai nhánh publish: field thường (không happens-before, thấy `@1.bps = 0`) vs `volatile` ((2) happens-before (3), thấy 150), trong mục "Vì sao thấy object nửa vời".
  - `concurrency-031` — **sơ đồ ASCII** lock contention: vùng găng 2 ms, 200 thread, hàng chờ BLOCKED, thông lượng 1/0.002 s = 500 req/s, thêm thread chỉ làm hàng chờ dài (định luật Little).
  - `jvm-029` — **sơ đồ ASCII** fast throw của C2: chưa đạt ngưỡng → NPE + fillInStackTrace (stack 100–200 frame); đã đạt → 1 instance dựng sẵn, log chỉ còn tên exception.
  - `jvm-030` — **sơ đồ ASCII** dead-code elimination: thân vòng lặp bị C2 xoá nên vòng for tự viết đo 0,9 ns/op (ảo), JMH chỉ chênh 15–25%.
- Kèm mỗi hình 1 câu dẫn "Hình dưới cho thấy…" / "Bảng dưới so sánh…"; hình ≤ 15 dòng, rộng ≤ 70 ký tự (dòng > 70 chỉ còn ở block có sẵn, không sửa).
- Không dùng backtick, không `${` trong template literal. Không đổi id/q/follow/tags.
- Nghiệm thu: `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo pre-existing `path.js` ngoài phạm vi sở hữu).
- Đã kiểm tra render bằng `App.md` (scripts/browser-shim.js): bảng ra `<table>` 4 cột, `~~~text` ra `<pre>`, không lọt fence. Không mở trình duyệt.
- Không commit (nhường integrator).
Reviewed-by: kilo (T2130R)
