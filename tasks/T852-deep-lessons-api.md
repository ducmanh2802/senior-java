# T852 — 2 bài senior: rate limiter phân tán và ETag/If-Match

Status: DONE
Agent: kilo
Owns: `js/data/lessons-api.js`
After: T813

Track **api**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **Sliding window counter vs token bucket**: công thức sliding window counter, so sánh độ chính xác ở ranh giới cửa sổ. Bài tập: cài cả hai với đồng hồ giả, test burst ở ranh giới.
2. **ETag + If-Match**: version → ETag, 412 khi không khớp, 428 khi thiếu If-Match. Bài tập: `ResourceStore` xử lý GET/PUT có điều kiện, test lost update bị chặn.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-api.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Đã thêm 2 bài senior vào `js/data/lessons-api.js` (chỉ append trước `);` cuối, không sửa bài cũ): `lesson-api-008` (order 8, "Rate limiter phân tán: sliding window counter vs token bucket, burst ở ranh giới") và `lesson-api-009` (order 9, "ETag + If-Match: conditional GET/PUT và chặn lost update (412/428)").
- Đếm id `grep -c "id: '"`: trước 7, sau 9 (= 7 + 2). Id dùng nháy đơn.
- `lesson-api-008`: body giải thích fixed window boundary burst, công thức sliding window counter (estimate = prev*weight + curr, weight = (window-elapsed)/window, xấp xỉ phân bố đều), token bucket (capacity/refill/burst/retryAfter), cơ chế thật Redis {{INCR}}/{{EXPIRE}}, Lua script nguyên tử, gateway (NGINX/Kong/Envoy), và điểm đơn giản hoá (fake clock {{nowMillis}}, đơn tiến trình, 1 key). Có `~~~seq` (4 actor). 1 bài tập tự chấm: `SlidingWindowCounter` + `TokenBucket` với đồng hồ giả, 6 case (dưới/vượt hạn mức, boundary burst bị chặn, trôi/reset qua ô, burst hợp lệ + retryAfter, refill không vượt capacity, retryAfter không đổi state). Starter có `UnsupportedOperationException("TODO")`.
- `lesson-api-009`: body giải thích ETag (strong/weak), {{If-None-Match}}→304, {{If-Match}}→412, 428 thiếu precondition, 409 nghiệp vụ; cơ chế thật Spring `ResponseEntity.eTag`, `WebRequest.checkNotModified`, `ShallowEtagHeaderFilter` (chỉ GET/304, không thay If-Match ghi), JPA `@Version`/`OptimisticLockException`, so sánh strong; điểm đơn giản hoá (Map thuần JDK, etag `vN`, nguyên tử ngữ nghĩa đơn tiến trình). Có `~~~seq` (4 actor). 1 bài tập tự chấm: `ResourceStore` (seed/get/put) 6 case (200/304, 404, 428 không đổi dữ liệu, khớp tăng version, lost update bị chặn 412 giữ dữ liệu A, retry sau 412 thành công). Starter có `UnsupportedOperationException("TODO")`.
- Nghiệm thu: `node scripts/test-lessons.js lesson-api-008` → OK 1/1 (6/6); `node scripts/test-lessons.js lesson-api-009` → OK 1/1 (6/6). `node scripts/build-light-index.js` → đã ghi. `node scripts/validate.js` → `OK — không có lỗi.` (các warning còn lại là của file/topic khác, không thuộc sở hữu task này). `node --check` lessons-api.js OK.
- Đề xuất cho integrator thêm vào `js/data/path.js`: track api, thêm `lesson-api-008`, `lesson-api-009` (validate cảnh báo 39 bài chưa nằm trong PATH, gồm 008/009 mới — ngoài phạm vi sở hữu task). `related` dùng id câu hỏi có thật: 008 → `api-014, api-036, api-038`; 009 → `api-014, api-037, api-038`. Không commit, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T852R)
