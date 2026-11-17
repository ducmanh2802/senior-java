# T2330 — 1 bài học Spring mới: mô phỏng @Transactional bằng dynamic proxy

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T2249

Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001`; grep `title:` trong file để không trùng. Thêm ĐÚNG 1 bài (id `lesson-<track>-NNN` + order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần (JDK 17, không class public ngoài Main, test ≥ 3 case deterministic), check 2–4 câu. Chủ đề: cách Spring tạo proxy cho @Transactional, vì sao self-invocation không có transaction, propagation REQUIRED vs REQUIRES_NEW. Bài tập: tự viết TransactionalProxy bằng java.lang.reflect.Proxy + TxManager giả đếm begin/commit/rollback; test self-invocation, rollback khi RuntimeException, không rollback checked exception mặc định.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-spring.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Số bài trong `lessons-spring.js`: **trước 19 → sau 20**. Id mới: `lesson-spring-020` (order 20), id lớn nhất trước đó là `lesson-spring-019`. Không sửa/xoá bài cũ (diff: +598 dòng, -0 dòng).
- Nội dung: cách Spring tạo proxy cho `@Transactional` (advisor = pointcut + `TransactionInterceptor`, auto proxy creator can thiệp `postProcessAfterInitialization`, JDK Proxy vs CGLIB và mặc định `proxy-target-class=true` của Boot 3), vì sao self-invocation không có transaction, `REQUIRED` vs `REQUIRES_NEW` ở mức connection/suspend/resume. Body ~9.200 ký tự, 8 mục `###`, 2 sơ đồ `~~~text`, bảng so sánh, ví dụ production có số liệu, đoạn trả lời phỏng vấn, `> Senior tip`.
- Bài tập (2 bài, code Java 17 thuần, không class public ngoài `Main`):
  1. `TransactionalProxy` bằng `java.lang.reflect.Proxy` + `TxManager` giả đếm begin/commit/rollback/join: test proxy ≠ target, self-invocation (`this.inner()` chỉ 1 transaction), `callInner()` qua proxy → join, RuntimeException → rollback + ném lại, checked exception mặc định commit, inner lỗi → rollback-only ở outer. Reference 6/6.
  2. `REQUIRES_NEW`: suspend/resume outer, commit độc lập dù outer rollback, inner rollback không giết outer, không có outer thì chạy như REQUIRED. Reference 3/3.
  Starter của cả hai bài biên dịch được và **không** pass hết test (0/6 và 0/3).
- Nghiệm thu đã chạy: `node --check js/data/lessons-spring.js` OK; `node scripts/build-light-index.js` (đã sinh lại `js/data/index-light.js`); `node scripts/test-lessons.js lesson-spring-020` → `Lesson exercises OK: 2/2`; `node scripts/test-lessons.js` → 309/309; `node scripts/validate.js` → `OK — không có lỗi.`
- Không sửa file nào ngoài `js/data/lessons-spring.js` (và `js/data/index-light.js` sinh tự động). Không commit.
Reviewed-by: kilo (T2330R)
