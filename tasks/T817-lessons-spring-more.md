# T817 — 2 bài Spring: self-invocation proxy và vòng phụ thuộc bean

Status: DONE
Agent: qoder
Owns: `js/data/lessons-spring.js`

Track **spring** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Vì sao @Transactional không chạy khi gọi nội bộ (self-invocation)**: proxy JDK/CGLIB bọc bên ngoài, this.method() đi thẳng không qua proxy, cách sửa (tách bean, TransactionTemplate). Bài tập: dùng java.lang.reflect.Proxy mô phỏng proxy transaction, đếm số lần begin/commit; chứng minh gọi nội bộ không mở transaction và sửa bằng cách tách service.
2. **Circular dependency và cách container xử lý**: constructor injection lỗi ngay, field/setter injection có early reference, vì sao Spring Boot 2.6+ cấm mặc định, cách thiết kế lại. Bài tập: mini container phát hiện vòng phụ thuộc và báo đường đi vòng (A → B → C → A).

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
- Đã THÊM 2 bài vào `js/data/lessons-spring.js` (chỉ chèn trước `);` cuối file, không sửa bài cũ):
  - `lesson-spring-010` (order 10) — "@Transactional không chạy khi gọi nội bộ: bản đồ proxy và cách sửa". Bài tập: `TxSim.wrap` dùng `java.lang.reflect.Proxy` mô phỏng transaction interceptor, đếm begin/join/commit/rollback, chứng minh self-invocation bỏ qua advice + case rollback-only (UnexpectedRollbackException) + annotation trên interface. 9 test case.
  - `lesson-spring-011` (order 11) — "Vòng phụ thuộc bean: early reference, ba cấp cache và cách thiết kế lại". Bài tập: `CycleContainer` phân biệt cycle constructor (không phá được) và cycle field (early reference, cờ `allowCircularReferences`), báo đúng đường đi `A -> B -> C -> A`. 8 test case.
- Đếm id trước/sau: `grep -c "id: '" js/data/lessons-spring.js` = 9 → 11 (thêm đúng 2 object).
- Về yêu cầu "chủ đề đã có thì chọn chủ đề khác": mục lục 1 & 2 của task **có** chồng lấn một phần với `lesson-spring-001` (circular dependency, mục ngắn) và `lesson-spring-002` (AOP proxy + logging self-call). Vẫn viết 2 bài theo yêu cầu vì góc khác biệt rõ và bài tập khác cơ chế: 010 đi sâu semantics của **transaction** (attribute lookup, REQUIRED join, rollback-only, TransactionTemplate mutable, 5 cách sửa) — 002 chỉ dạy advice logging; 011 đi sâu **cơ chế phá vòng** (3 cấp cache, ObjectFactory/getEarlyBeanReference, mặc định Boot 2.6+, 4 kiểu refactor, in đường đi cycle) — 001 chỉ nói "cycle constructor thì fail". Hai bài mới đều cross-reference bài cũ để người học không đọc trùng.
- Nghiệm thu: `node scripts/test-lessons.js lesson-spring-010` → reference 9/9, starter pass 0; `lesson-spring-011` → 8/8; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js lessons-spring.js` → OK — không có lỗi.
- **Đề xuất cho integrator**: thêm `lesson-spring-010`, `lesson-spring-011` vào một stage phù hợp của `js/data/path.js` (validate đang cảnh báo "24 bài học không nằm trong PATH", trong đó có 2 id mới này).
- **Không phải file của task này**: khi chạy `node scripts/validate.js` toàn repo (lần cuối) phát sinh 1 lỗi ở `js/data/lessons-banking.js`: `lesson-banking-008.exercises[0].hints[0]` có `{{synchronized (b) { ... …}}` — inline code chứa dấu { } lồng nhau. File thuộc task khác (banking, chưa commit), tôi không sửa theo luật 3. Cần task sở hữu `lessons-banking.js` sửa hint đó (bỏ {{}} quanh code có dấu ngoặc nhọn, đưa vào code block).
Reviewed-by: kilo (T817R)
