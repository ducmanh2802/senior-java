# T642 — 4 bài học automation cơ bản (001–004)

Status: DONE
Agent: qoder
Owns: `js/data/lessons-autotest.js`

Bối cảnh: topic mới **autotest** ("Automation Test (QA → SDET)") dạy automation test **từ cơ bản tới nâng cao** cho dev Java 4 năm muốn hiểu/chuyển sang SDET. **CÔNG CỤ CHÍNH LÀ PLAYWRIGHT FOR JAVA** (com.microsoft.playwright: Playwright, Browser, BrowserContext, Page, Locator, getByRole/getByTestId, auto-wait, assertThat từ PlaywrightAssertions, APIRequestContext, tracing, storageState, codegen, sharding): mọi ví dụ code và bài tập lấy Playwright làm mặc định. Selenium 4 chỉ nhắc để so sánh/khi phỏng vấn hỏi (nhiều công ty VN còn dùng). Stack phụ: Java 17, JUnit 5 / TestNG, **REST Assured**, Cucumber-JVM (Gherkin), Allure report, WireMock, Testcontainers, k6/JMeter/Gatling, GitHub Actions/Jenkins, Appium 2 (mobile). Chỉ viết API có thật; không chắc thì viết ít lại. Topic **testing** (q-soft.js, lessons-testing.js) đã có phần test dành cho dev (mock/stub, Testcontainers, contract, mutation, flaky 1/30, load test API, Clock injection): đọc để KHÔNG trùng, có thể nhắc liên kết.

Thêm 4 bài, order 1–4:
1. **lesson-autotest-001 — Automation test là gì, test pyramid, chọn cái gì để tự động hoá**: manual vs automation, ROI (chi phí viết + bảo trì vs số lần chạy), UI/API/unit, regression suite, smoke/sanity, vai trò QA/SDET. Kỹ thuật thiết kế test case: equivalence partitioning, boundary value, decision table. Bài tập: `TestDesign.boundaries(min, max)` và `TestDesign.decisionTable(rules)` sinh bộ case tối thiểu cho form đăng ký (tuổi 18–60, mật khẩu 8–64 ký tự); ≥ 6 case.
2. **lesson-autotest-002 — Locator: id, CSS, XPath, data-testid và vì sao locator vỡ**: DOM là cây, cách trình duyệt tìm phần tử, độ bền từng loại locator, Playwright getByRole/getByText/getByTestId và locator chaining/filter là trọng tâm; CSS/XPath là phương án dự phòng. Bài tập: fake DOM (`Node` có tag, attributes, children, text) + `Locator.css(String)` hỗ trợ tập con `tag`, `#id`, `.class`, `[attr=value]`, quan hệ con cháu bằng dấu cách; ≥ 7 case.
3. **lesson-autotest-003 — Auto-wait và web-first assertion của Playwright (so với wait của Selenium)**: vì sao Thread.sleep làm test chậm + flaky, actionability checks (visible, stable, enabled, receives events), assertThat(locator).hasText tự retry, timeout; so sánh WebDriverWait + ExpectedConditions, polling interval, ignoring exceptions, StaleElementReferenceException, không trộn implicit với explicit. Bài tập: `FluentWait<T>(FakeClock)` với timeout, polling, ignoring(Class) và `until(Function)` — dùng FakeClock tự tiến thời gian; ≥ 6 case (thành công lần thứ 3, timeout, exception bị ignore, exception không ignore).
4. **lesson-autotest-004 — Page Object Model và Page Factory / Screenplay**: tách locator + hành động khỏi test, fluent page (method trả page tiếp theo), không assert trong page object, so sánh POM vs Screenplay. Bài tập: trên fake browser (Map url → page state) viết `LoginPage`, `DashboardPage` fluent; test đăng nhập đúng/sai/khoá tài khoản; ≥ 5 case.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc bài đã có trong `js/data/lessons-autotest.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id `lesson-autotest-NNN` và `order` đúng như đề bên dưới, track `autotest`.
- Body ≥ 3000 ký tự, giải thích từ gốc cho người chưa từng làm automation: khái niệm → vì sao → ví dụ code **Playwright for Java thật** (REST Assured cho API khi phù hợp) trong ~~~java (chỉ để đọc, có comment) → bảng so sánh → pitfall production → kết bằng "### Liên hệ phỏng vấn".
- Bài tập **không thể chạy browser**: mô phỏng cơ chế bằng Java thuần (fake DOM, fake clock, fake HTTP handler…), chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep / thời gian thực / random không seed), ≥ 5 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js lesson-autotest-NNN` cho từng bài (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes

Status: DONE

- Đã thêm 4 bài `lesson-autotest-001..004` (order 1–4, track `autotest`) vào `js/data/lessons-autotest.js` — file trước đó là stub rỗng (0 id), sau khi thêm đếm `id: 'lesson-autotest` = 4, không ghi đè nội dung nào khác.
- Nội dung: 001 ROI/pyramid/EP/BVA/decision table (kèm sơ đồ `~~~seq` pipeline CI); 002 locator + fake DOM + tự viết CSS subset; 003 wait + FluentWait/FakeClock; 004 POM/PageFactory deprecated/Screenplay + fake browser. Mỗi bài body > 3000 ký tự, 1 exercise, 4 câu check, bài tập 100% Java thuần deterministic (không browser, không ngủ thật).
- Nghiệm thu từng bài: `node scripts/test-lessons.js lesson-autotest-00N` — reference pass hết (8/8, 9/9, 7/7, 10/10), starter biên dịch được và không pass hết. ✅
- `node scripts/validate.js`: **0 lỗi thuộc lessons-autotest.js** (4 bài được load, đếm "autotest 4"). Validator hiện còn 4 lỗi **ngoài phạm vi T642**, đều do `q-autotest.js` của task khác đang được agent khác ghi dở trong phiên này (file lớn dần 42KB→51KB, chưa có `);` đóng, thừa dấu `,` đầu file, kèm file rác `js/data/.tmp-q2.txt` 2 byte):
  1. `q-autotest.js: Unexpected token ','` (dòng 3)
  2. `.tmp-q2.txt: file không được khai báo trong data-manifest.js`
  3. `lesson-autotest-001: related "autotest-001"` — chỉ là hệ quả của (1): id có thật trong q-autotest.js, hết lỗi khi file đó load được
  4. `index-light.js đã cũ` — `build-light-index` crash vì (1)
  Theo luật 3 AGENTS.md tôi **không sửa file của task khác**. Người tích hợp (hoặc chính agent T-autotest) cần: sửa dấu `,` thừa + đóng `);` cuối `q-autotest.js`, xóa `js/data/.tmp-q2.txt` của họ, rồi chạy `node scripts/build-light-index.js` và `node scripts/validate.js` — dự kiến OK (lesson 001 có `related: ['autotest-001']`, giữ nguyên id này giúp khớp).
- Không commit, không branch, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T642R)
