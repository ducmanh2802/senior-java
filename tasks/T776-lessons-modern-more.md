# T776 — 2 bài Java hiện đại: Collectors nâng cao và fan-out song song

Status: DONE
Agent: qoder
Owns: `js/data/lessons-modern.js`

Track **modern** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Collectors nâng cao: groupingBy, partitioningBy, toMap merge, teeing**: downstream collector, giữ thứ tự bằng LinkedHashMap/TreeMap, IllegalStateException khi toMap trùng key, báo cáo doanh thu theo tháng/khách. Bài tập: từ List<Order> tạo báo cáo nhiều cấp bằng stream, kết quả phải đúng thứ tự.
2. **Fan-out gọi nhiều service song song: CompletableFuture, timeout, virtual threads**: allOf, orTimeout/completeOnTimeout, xử lý lỗi từng nhánh, so sánh với virtual threads Java 21 và structured concurrency (chỉ giải thích trong body; bài tập chạy Java 17). Bài tập: `Aggregator` gọi 3 nguồn giả (Supplier có độ trễ xác định qua latch), nguồn lỗi/chậm thì dùng giá trị mặc định, không treo.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-modern.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

Thêm 2 bài vào `js/data/lessons-modern.js` (chèn trước dòng `);` cuối file, không sửa bài cũ):

- `lesson-modern-006` (order 6) — Collectors nâng cao: downstream collector, mapFactory giữ thứ tự
  (HashMap/LinkedHashMap/TreeMap), merge function của `toMap` khi key trùng, `partitioningBy`,
  `teeing`, `reducing`/`mapping`/`maxBy`. 2 bài tập tự chấm (7 + 7 case): báo cáo doanh thu nhiều cấp
  sắp theo tổng giảm dần (tie-break mã khách) và `OrderAudit` (toMap merge + partitioningBy + teeing lồng).
- `lesson-modern-007` (order 7) — Fan-out gọi nhiều service: `supplyAsync` với executor riêng,
  `allOf`, `orTimeout`/`completeOnTimeout`, fallback từng nhánh, so sánh virtual threads Java 21 và
  structured concurrency (chỉ giải thích trong body). 2 bài tập tự chấm (8 + 6 case): `Aggregator.fetchAll`
  (chặn sau khi fan-out, timeout + fallback) và `PageBuilder.page` (trả `CompletableFuture`, không chặn).
  Test deterministic: điều khiển bằng `CountDownLatch`/`CyclicBarrier`, không sleep theo thời gian thực.

Cả 4 bài tập chạy Java 17, `node scripts/test-lessons.js` → 173/173 OK (reference pass hết, starter biên dịch được và không pass hết).
`node scripts/build-light-index.js` và `node scripts/validate.js` → OK — không có lỗi.

Đề xuất cho integrator (không tự sửa vì không thuộc task này):
- Thêm `lesson-modern-006`, `lesson-modern-007` vào `lessons` của một stage trong `js/data/path.js`
  (validate đang cảnh báo "10 bài học không nằm trong PATH", trong đó có 2 id mới này).
- Track `modern` chưa có bài nào về `CompletableFuture`; chủ đề fan-out đã có ở track `concurrency`
  (`lesson-concurrency-004`, `-006`, virtual threads ở `-005`) nên bài 007 viết theo góc "aggregator/page BFF
  + timeout + fallback" và không trùng khuôn bài tập với các bài đó.
- Trong lúc làm, `js/data/q-english.js` từng bị lỗi cú pháp (`},,{` tại dòng ~5167) do task khác; lỗi đã được
  khắc trước khi gate chạy, không cần xử lý thêm.
Reviewed-by: kilo (T776R)
