# T646 — 15 câu automation nâng cao (autotest-016..030)

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`
After: T645

Bối cảnh: topic mới **autotest** ("Automation Test (QA → SDET)") dạy automation test **từ cơ bản tới nâng cao** cho dev Java 4 năm muốn hiểu/chuyển sang SDET. **CÔNG CỤ CHÍNH LÀ PLAYWRIGHT FOR JAVA** (com.microsoft.playwright: Playwright, Browser, BrowserContext, Page, Locator, getByRole/getByTestId, auto-wait, assertThat từ PlaywrightAssertions, APIRequestContext, tracing, storageState, codegen, sharding): mọi ví dụ code và bài tập lấy Playwright làm mặc định. Selenium 4 chỉ nhắc để so sánh/khi phỏng vấn hỏi (nhiều công ty VN còn dùng). Stack phụ: Java 17, JUnit 5 / TestNG, **REST Assured**, Cucumber-JVM (Gherkin), Allure report, WireMock, Testcontainers, k6/JMeter/Gatling, GitHub Actions/Jenkins, Appium 2 (mobile). Chỉ viết API có thật; không chắc thì viết ít lại. Topic **testing** (q-soft.js, lessons-testing.js) đã có phần test dành cho dev (mock/stub, Testcontainers, contract, mutation, flaky 1/30, load test API, Clock injection): đọc để KHÔNG trùng, có thể nhắc liên kết.

Thêm 15 câu **autotest-016 → autotest-030**, level ~2 mid / 8 senior / 5 lead. Chủ đề:
- Thiết kế automation framework từ đầu cho team 10 QA (lớp, config, DriverFactory ThreadLocal, reporting).
- Chạy song song với Playwright (Browser/Context/Page theo thread, Docker image, sharding CI), so với Selenium Grid 4; vì sao test phải độc lập mới song song được.
- Flaky test: đo, cách ly, sửa tận gốc; vì sao retry tự động nguy hiểm.
- Suite UI 2 giờ cần xuống < 20 phút: phân tích và kế hoạch.
- Visual regression testing: cách hoạt động, ngưỡng sai khác, chi phí bảo trì.
- Contract testing vs E2E giữa microservices từ góc nhìn QA (liên kết topic testing, không lặp lại).
- Performance test với k6/JMeter/Gatling: workload model, think time, ramp-up, đọc p95/p99 (không trùng câu load test đã có trong topic testing — tập trung góc QA tooling).
- Playwright APIRequestContext cho API test và kết hợp UI+API trong một test (setup dữ liệu bằng API, kiểm tra bằng UI); network interception page.route để mock backend.
- Shift-left & test trong pipeline: test nào chạy ở PR, nightly, trước release.
- Test phụ thuộc bên thứ ba (payment, OTP, email): WireMock, sandbox, test hook.
- Bảo mật cơ bản trong automation (OWASP ZAP baseline trong CI) — mức QA.
- Đo chất lượng: defect leakage, coverage theo requirement, flaky rate; báo cáo cho quản lý.
- AI trong testing (self-healing locator, sinh test case bằng LLM): lợi ích và rủi ro thật.
- (lead) Xây dựng QA/automation strategy cho sản phẩm fintech chưa có test.
- (lead) Phỏng vấn tuyển SDET: bạn hỏi gì, bài tập gì để đánh giá.

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
- Verified file state on 2026-11-05: `js/data/q-autotest.js` already contained the full required set `autotest-016` → `autotest-030` (15 questions) plus `autotest-001`–`004` and `autotest-005`–`015` (30 questions total). No duplicate IDs; all `topic: 'autotest'`. No syntax issues (`node --check` OK).
- Did not rewrite/overwrite the file (preserved existing content). Counts: `grep -c "id: '"` = 19 (single-quoted IDs 001-004,016-030), `grep -c 'id: "'` = 11 (double-quoted IDs 005-015), total 30 autotest questions.
- `node scripts/build-light-index.js` OK (autotest 30 câu hỏi, 0 trắc nghiệm). `node scripts/validate.js` → OK — không có lỗi. `node scripts/check-links.mjs js/data/q-autotest.js` → 0 hỏng, 0 cảnh báo.
- IDs delivered (T646 scope): autotest-016, autotest-017, autotest-018, autotest-019, autotest-020, autotest-021, autotest-022, autotest-023, autotest-024, autotest-025, autotest-026, autotest-027, autotest-028, autotest-029, autotest-030.
- No git commands run. No browser/npm install. No files outside owned scope modified (only `tasks/T646-q-autotest-2.md` updated for status/notes).
Reviewed-by: kilo (T646R)
