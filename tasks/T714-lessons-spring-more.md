# T714 — 2 bài Spring mô phỏng cơ chế

Status: DONE
Agent: qoder
Owns: `js/data/lessons-spring.js`

Track **spring** đã có 7 bài (đọc hết, không trùng). Thêm các bài dưới, order tiếp nối số lớn nhất, bài tập Java thuần chạy với Java 17 và tự chấm. Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.
1. **Auto-configuration của Spring Boot**: @Conditional (OnClass, OnProperty, OnMissingBean), thứ tự, vì sao bean của bạn thắng bean mặc định, đọc báo cáo --debug. Bài tập: mini container đăng ký "auto-config" có điều kiện OnProperty/OnMissingBean, trả danh sách bean cuối cùng; ≥ 6 case.
2. **Spring Events và @TransactionalEventListener**: publish trong transaction, phase AFTER_COMMIT, vì sao gửi email trong transaction là sai, outbox khi cần chắc chắn. Bài tập: `EventBus` có transaction giả: listener thường chạy ngay, listener AFTER_COMMIT chỉ chạy khi commit, rollback thì bỏ; ≥ 5 case.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-spring.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Đã THÊM 2 bài vào cuối mảng trong `js/data/lessons-spring.js`, không sửa 7 bài cũ: số `id: '` trước = 7, sau = 9.
  - `lesson-spring-008` (order 8, senior, 45'): Auto-configuration và @Conditional (OnProperty / OnPropertyValue / OnMissingBean, thứ tự đăng ký, báo cáo `--debug`). Bài tập `AutoConfig` mini-container, 14 test case (≥ 6 theo task).
  - `lesson-spring-009` (order 9, senior, 45'): Spring Events và @TransactionalEventListener (IMMEDIATE chạy trong tx, AFTER_COMMIT/AFTER_COMPLETION, fallbackExecution=false, exception sau commit, outbox + CDC). Bài tập `EventBus` với transaction giả, 13 test case (≥ 5 theo task).
- Hai chủ đề được giao đều CHƯA có trong track (đã đọc 7 bài cũ: IoC/DI, AOP proxy, @Transactional propagation, lifecycle/scope, MVC flow, Flyway runner, Jackson mapper) → không phải đổi chủ đề.
- `related`: 008 → `spring-007`, 009 → `spring-016` (id câu hỏi có thật trong `js/data/q-spring-data.js`); body dùng khối `~~~seq` cho luồng ≥ 3 hệ thống (thứ tự đăng ký bean, email trong transaction, outbox → Kafka).
- Đã chạy: `node scripts/test-lessons.js lesson-spring-008` → 14/14, `lesson-spring-009` → 13/13, `node scripts/test-lessons.js` → 158/158 OK (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js` (ghi lại `js/data/index-light.js`), `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
- **Đề xuất cho integrator** — thêm 2 id vào `js/data/path.js` (path-07 là đường Spring hiện đang liệt kê lesson-spring-001..007), ví dụ nối tiếp cuối mảng `lessons` của path-07:
  ```
  'lesson-spring-008', 'lesson-spring-009'
  ```
  Cảnh báo `path.js: có N bài học không nằm trong PATH` hiện đã tăng từ 35 lên 37 (có sẵn nhiều bài khác của task khác chưa vào PATH — integrator rà một lượt).
- Không gọi AI, không mở trình duyệt, không kill tiến trình, không npm install; chỉ sửa `js/data/lessons-spring.js`, `js/data/index-light.js` (file sinh tự động theo luật 6) và file task này.
Reviewed-by: kilo (T714R)
