# T595 — 2 bài học Java core có bài tập tự chấm

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`

Thêm 2 bài (track core):
1. **equals/hashCode/compareTo đúng chuẩn**: hợp đồng, vì sao HashMap cần cả hai, key mutable, consistent with equals, record tự sinh. Bài tập: lớp `Money(long amountMinor, String currency)` với equals/hashCode/compareTo (cùng currency), `add`, ném IllegalArgumentException khi khác currency; test dùng HashSet/TreeSet.
2. **Exception handling cho service**: checked vs unchecked, try-with-resources + suppressed, wrap giữ cause, không nuốt exception, mapping lỗi domain. Bài tập: `Result<T>`/`retry(Supplier, maxAttempts, retryOn)` chỉ retry exception được phép, ném lại exception cuối kèm suppressed của các lần trước.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-core.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

- Đã THÊM 2 bài vào cuối mảng `js/data/lessons-core.js` (không sửa bài cũ):
  - `lesson-core-006` — "equals, hashCode, compareTo: bộ ba quyết định hành vi trong collection" (order 6, senior, 30 phút).
    Bài tập: `Money(long amountMinor, String currency)` bất biến — equals/hashCode theo cả hai field, `add` ném `IllegalArgumentException` khi khác currency (dùng `Math.addExact` chống tràn), `compareTo` chỉ so trong cùng tiền tệ. 9 test chạy thật qua `HashSet`, `TreeSet`, `Collections.sort`, `HashMap` → reference **9/9**, starter không pass.
  - `lesson-core-007` — "Xử lý exception trong service: wrap giữ cause, retry có điều kiện và Result" (order 7, senior, 30 phút).
    Bài tập: `Result<T>` (success/failure/of/isSuccess/value/error, giữ đúng instance lỗi) + `Attempts.retry(action, maxAttempts, retryOn)` — chỉ retry lỗi mà `retryOn` chấp nhận, lỗi không được phép thì ném lại nguyên instance ngay, hết lần thì ném lỗi lần cuối và gắn các lỗi trước vào `getSuppressed()` theo thứ tự thời gian; `Attempts.attempt(...)` trả `Result` thay vì ném. 7 test deterministic (đếm số lần gọi bằng `AtomicInteger`, không sleep) → reference **7/7**, starter không pass.
- Nội dung 007 cố ý không trùng `lesson-core-001` (bài đó thiên về taxonomy + try-with-resources): 007 tập trung wrap-keep-cause, chống nuốt exception, `Result` vs exception, chính sách retry + idempotency, mapping lỗi domain → HTTP.
- Gate đã chạy: `node scripts/test-lessons.js lesson-core-006` (9/9), `node scripts/test-lessons.js lesson-core-007` (7/7), `node scripts/test-lessons.js` → `108/108`, `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.`
- **Đề xuất cho integrator**: thêm `lesson-core-006` và `lesson-core-007` vào `js/data/path.js` (validate đang cảnh báo "có 2 bài học không nằm trong PATH" vì `path.js` không thuộc quyền sửa của task này). Gợi ý đặt cạnh các bài core hiện có, 006 sau nhóm collections/value type, 007 cạnh `lesson-core-001`.
- File bị thay đổi: `js/data/lessons-core.js`, `js/data/index-light.js` (sinh lại theo luật 6), `tasks/T595-lessons-core-2.md`. Không commit.Reviewed-by: kilo (T595R)
Reviewed-by: kilo (T595R)
