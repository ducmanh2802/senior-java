# T2163 — Rà soát chất lượng 15 câu mới nhất trong q-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`
After: T1449

## Notes

Đã rà soát 15 câu mới nhất (autotest-031 → autotest-045).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| autotest-041 | Code ví dụ `~~~java` dùng `com.microsoft.playwright.APIRequestContext api` làm tham số `@BeforeAll` — không thể tạo được instance bằng cách đó; `APIRequestContext` phải được tạo từ `Playwright` (ví dụ `pw.request().newContext()`), và `static` method `@BeforeAll` không nhận tham số `APIRequestContext`. | Sửa block `~~~java` ở autotest-041: `authOnce(Playwright pw)` tự tạo `APIRequestContext api = pw.request().newContext()`, gọi `api.post(...)`, lưu token, rồi `api.dispose()`. |

Các câu còn lại (autotest-031 → autotest-045): kiểm tra kỹ thuật (Playwright for Java API, JUnit 5, Testcontainers, axe-core, i18n, contract test, POM, storageState, trace/codegen, flaky, parallel, accessibility) đều đúng, dùng `{{code}}` thay backtick, có `> Senior tip:`, `follow` 3 câu, `refs` ≤ 5, markup hợp lệ, không HTML thô, không `${` trong template literal. Đã giữ nguyên số mục (45 câu).

Kiểm tra: `node --check js/data/q-autotest.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu mới nhất (`node scripts/qtool.js list js/data/q-autotest.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật về test automation (JUnit 5, Mockito, Testcontainers, Selenium/Playwright, RestAssured): API có thật, ví dụ chạy được; có cấu trúc đủ theo AGENTS.md mục 6.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Reviewed-by: kilo (T2163R)
