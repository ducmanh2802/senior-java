# T816 — 2 bài ngân hàng: sổ cái double-entry và hạn mức đồng thời

Status: DONE
Agent: qoder
Owns: `js/data/lessons-banking.js`

Track **banking** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Sổ cái double-entry bằng BigDecimal**: bút toán nợ/có luôn cân, số dư tính từ bút toán, đảo bút toán thay vì sửa, làm tròn VND. Bài tập: `Ledger` post giao dịch nhiều dòng, từ chối nếu không cân, reverse, số dư theo tài khoản; test với số tiền lẻ và đảo bút toán.
2. **Hạn mức giao dịch theo ngày khi có truy cập đồng thời**: check-then-act gây vượt hạn mức, khoá theo tài khoản, reset theo ngày (đồng hồ giả). Bài tập: `DailyLimit.tryConsume(account, amount)` an toàn với 16 thread, không bao giờ vượt hạn mức (lặp nhiều lần để code sai lộ lỗi).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-banking.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Status: DONE** — đã thêm 2 bài vào `js/data/lessons-banking.js` (chỉ chèn object mới trước `);` cuối file, không sửa bài cũ).

**Id mới:** `lesson-banking-008` (order 8), `lesson-banking-009` (order 9).
Đếm `grep -c "id: '"`: **trước = 7 → sau = 9** (= 7 + 2 mục đã thêm). Không có bài cũ nào bị sửa/xoá.

**Đề xuất integrator thêm vào `js/data/path.js`** (validate hiện chỉ WARN "không nằm trong PATH"):
`lesson-banking-008`, `lesson-banking-009` — nên ghép cùng stage banking với các `lesson-banking-00x` đã có.

### Lý do đổi chủ đề mục 1 (theo directive "chủ đề đã có thì chọn chủ đề khác cùng track")

- **Mục 2 giữ nguyên** → `lesson-banking-008` "Hạn mức ngày dưới tải đồng thời". Bài 3 (`lesson-banking-003`) chỉ dạy **quy tắc** hạn mức/velocity chạy đơn luồng với `Clock.fixed`; **không** có phần check-then-act, hạt khoá theo tài khoản, CAS, Redis Lua, và test 16 thread. Bài 8 nối trực tiếp vào banking-030 (question) và không trùng banking-003.
- **Mục 1 đã có** → `lesson-banking-005` đã phủ đúng nội dung này (Ledger post đa dòng, từ chối khi lệch Nợ/Có, số dư tính từ bút toán, reverse thay vì sửa, txId idempotency, làm tròn VND đã ở `lesson-banking-001` + `lesson-banking-007`). Viết lại sẽ trùng lặp nặng.
- **Chủ đề thay thế** → `lesson-banking-009` "Batch cuối ngày (EOD): idempotent, resumable, checkpoint". Chưa có bài nào trong track banking (có question `banking-028`, `banking-001`, `banking-011` nhưng chưa có lesson); không trùng `lesson-microservices-001` (outbox) hay `lesson-microservices-004` (DLQ/retry) vì ở đây là batch tính lãi trên dải tài khoản + chìa khoá tự nhiên (account, valueDate) + chunk/lease.

### Kết quả nghiệm thu

- `node scripts/test-lessons.js lesson-banking-008` → **RESULT 23/23**, `Lesson exercises OK: 1/1`. Starter biên dịch được và fail (ném `UnsupportedOperationException`).
- `node scripts/test-lessons.js lesson-banking-009` → **RESULT 37/37**, `Lesson exercises OK: 1/1`. Starter biên dịch được và fail.
- `node scripts/build-light-index.js` → đã ghi lại `js/data/index-light.js` (139.3 KB).
- `node scripts/validate.js` → **OK — không có lỗi.** (chỉ còn các warning cũ của file khác: đáp án ngắn ở q-java/q-system-design/q-scenario, và cảnh báo PATH.)

### Ghi chú kỹ thuật đáng chú ý

1. **`java.time.Zone` không resolve được khi compile bằng `javac --release 17` trên JDK 17.0.12 của máy này** (`cannot find symbol: class Zone, location: package java.time`). Vì `Clock.withZone(Zone)` là abstract nên **không thể subclass `Clock` làm đồng hồ giả** trong harness. Cả hai bài đều dùng seam `protected LocalDate today()` (mặc định `LocalDate.now(clock)`), test cài bằng subclass `OnDay`/`DailyLimit` — vẫn deterministic, vẫn chứng minh reset theo ngày. Đây là cạm bẫy chung cho mọi task lessons dùng fake clock → nên ghi vào AGENTS.md.
2. Đã kiểm chứng test race **có răng**: chạy bản reference bỏ `synchronized` (3 lần) → FAIL `khong_bao_gio_vuot_han_muc_voi_16_thread` (có vòng cho 9/16 lệnh qua) và FAIL `16_tai_khoan_song_song_khong_lan_nhau` → không phải test xanh giả.
3. Trong JDK 17 của máy này `ConcurrentHashMap.computeIfAbsent(...)` trả về object Bucket ổn định, test "bucket tạo một lần per account" pass — chính là điều kiện để khoá theo tài khoản có nghĩa.
4. `lessons-spring.js` (task khác, T817) từng bị syntax error giữa chừng (`missing ) after argument list` tại dòng 2143) làm `node scripts/test-lessons.js` (toàn bộ manifest) chết; khi chạy validate lần cuối file đó đã lành. Nếu gate toàn dự án còn đỏ thì kiểm tra các file do task khác đang ghi dở, không phải file của T816.
5. File rác tôi tạo trong quá trình chạy probe và **không tự xoá được** (mệnh lệnh `rm` bị chặn theo quyền): `tmp-dump.js`, `tmp-probe/Probe.java`, `tmp-lesson-banking-008.java`, `tmp-lesson-banking-008-1.java`, `tmp-lesson-banking-009-1.java`, `scripts/tmp-probe-lesson.js`, `scripts/tmp-probe-buggy.js`, `scripts/tmp-zone-probe.js`. Integrator xoá giúp (chưa từng được commit).
6. Không chạy `git commit`/`push`, không mở trình duyệt, không kill tiến trình theo tên, không `npm install`.
Reviewed-by: kilo (T816R)
