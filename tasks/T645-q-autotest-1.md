# T645 — 15 câu automation cơ bản → trung cấp (autotest-001..015)

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`

Bối cảnh: topic mới **autotest** ("Automation Test (QA → SDET)") dạy automation test **từ cơ bản tới nâng cao** cho dev Java 4 năm muốn hiểu/chuyển sang SDET. **CÔNG CỤ CHÍNH LÀ PLAYWRIGHT FOR JAVA** (com.microsoft.playwright: Playwright, Browser, BrowserContext, Page, Locator, getByRole/getByTestId, auto-wait, assertThat từ PlaywrightAssertions, APIRequestContext, tracing, storageState, codegen, sharding): mọi ví dụ code và bài tập lấy Playwright làm mặc định. Selenium 4 chỉ nhắc để so sánh/khi phỏng vấn hỏi (nhiều công ty VN còn dùng). Stack phụ: Java 17, JUnit 5 / TestNG, **REST Assured**, Cucumber-JVM (Gherkin), Allure report, WireMock, Testcontainers, k6/JMeter/Gatling, GitHub Actions/Jenkins, Appium 2 (mobile). Chỉ viết API có thật; không chắc thì viết ít lại. Topic **testing** (q-soft.js, lessons-testing.js) đã có phần test dành cho dev (mock/stub, Testcontainers, contract, mutation, flaky 1/30, load test API, Clock injection): đọc để KHÔNG trùng, có thể nhắc liên kết.

Thêm 15 câu **autotest-001 → autotest-015**, level ~6 mid / 7 senior / 2 lead. Chủ đề (mỗi ý 1 câu, đặt theo kiểu phỏng vấn thật):
- Test pyramid / testing trophy: tự động hoá cái gì trước, ROI automation.
- Playwright for Java hoạt động bên trong thế nào (driver Node.js đi kèm, kết nối trình duyệt qua giao thức riêng/CDP, BrowserContext cô lập như profile ẩn danh) và khác Selenium WebDriver (W3C protocol, driver binary) ra sao.
- Selenium vs Playwright vs Cypress: kiến trúc, auto-wait, đa trình duyệt, khi nào chọn cái nào.
- Chiến lược locator bền vững; cộng tác với dev thêm data-testid.
- Auto-wait, actionability checks và web-first assertion của Playwright; vì sao Selenium cần explicit wait và hay gặp StaleElementReferenceException.
- Page Object Model: lỗi hay gặp (assert trong page, page khổng lồ), so với Screenplay.
- JUnit 5 vs TestNG cho automation; data-driven.
- REST Assured: test API end-to-end, chain request, schema validation.
- Quản lý test data: tạo qua API thay vì UI, dọn dẹp, dữ liệu song song không đụng nhau.
- Xử lý iframe, nhiều tab/cửa sổ, file upload/download, alert.
- Đăng nhập nhanh: tái dùng session/cookie/storage state thay vì login UI mỗi test.
- BDD/Cucumber: khi nào có lợi, khi nào là gánh nặng.
- Debug test fail: Playwright Trace Viewer, screenshot/video, codegen, Allure report.
- Chạy automation trong CI (GitHub Actions/Jenkins): headless, artifact, gate merge.
- (lead) Dev 4 năm chuyển sang SDET/automation: kỹ năng cần bù, lộ trình 3–6 tháng, lợi/hại nghề nghiệp, thị trường Việt Nam (viết cân bằng, không bịa số liệu lương cụ thể).

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm chưa làm automation, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** vào cuối mảng trong `js/data/q-autotest.js`, topic `autotest`, id đúng dải được giao (kiểm tra trùng trước khi ghi). Không sửa mục cũ.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, code Java ngắn có comment, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu. `refs` chỉ dùng link chắc chắn tồn tại (selenium.dev, playwright.dev/java, rest-assured.io, junit.org, cucumber.io, martinfowler.com), chạy `node scripts/check-links.mjs js/data/q-autotest.js`.

## Nghiệm thu
`node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id vào Notes.

## Notes
- IDs trước khi thêm (autotest): 0. Sau khi thêm: 15 (`grep "id: .*autotest-" js/data/q-autotest.js | wc -l` = 15).
- Đã thêm autotest-001..015 vào `js/data/q-autotest.js` (chèn trước dòng `);` cuối, không xoá/sửa object cũ).
- Levels: 6 mid (001,004,005,007,010,013), 8 senior (002,003,006,008,009,011,012,014), 1 lead (015).
- Nội dung Playwright for Java là mặc định trong ví dụ/giải thích; có so sánh Selenium 4 khi phù hợp (kiến trúc, wait/Stale, chọn công cụ). API test dùng REST Assured; refs: playwright.dev/java, selenium.dev, rest-assured.io, junit.org, cucumber.io, docs.github.com, jenkins.io, allurereport.org, martinfowler.com.
- Đã fix lỗi validate: bỏ file tạm `.tmp-q2.txt` trong `js/data/`, sửa inline code POST có `{id}` lồng nhau (002), thay thẻ HTML thô `<input type="file">` (010).
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK (chỉ warning path.js lessons-autotest không nằm PATH, không thuộc file này). Không commit.
Reviewed-by: kilo (T645R)
