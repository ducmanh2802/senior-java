# T647 — 15 câu trắc nghiệm automation (qz-autotest-001..015)

Status: DONE
Added qz-autotest-001..015 (3 multi)
Agent: kilo
Owns: `js/data/quiz-autotest.js`
After: T645

Bối cảnh: topic mới **autotest** ("Automation Test (QA → SDET)") dạy automation test **từ cơ bản tới nâng cao** cho dev Java 4 năm muốn hiểu/chuyển sang SDET. **CÔNG CỤ CHÍNH LÀ PLAYWRIGHT FOR JAVA** (com.microsoft.playwright: Playwright, Browser, BrowserContext, Page, Locator, getByRole/getByTestId, auto-wait, assertThat từ PlaywrightAssertions, APIRequestContext, tracing, storageState, codegen, sharding): mọi ví dụ code và bài tập lấy Playwright làm mặc định. Selenium 4 chỉ nhắc để so sánh/khi phỏng vấn hỏi (nhiều công ty VN còn dùng). Stack phụ: Java 17, JUnit 5 / TestNG, **REST Assured**, Cucumber-JVM (Gherkin), Allure report, WireMock, Testcontainers, k6/JMeter/Gatling, GitHub Actions/Jenkins, Appium 2 (mobile). Chỉ viết API có thật; không chắc thì viết ít lại. Topic **testing** (q-soft.js, lessons-testing.js) đã có phần test dành cho dev (mock/stub, Testcontainers, contract, mutation, flaky 1/30, load test API, Clock injection): đọc để KHÔNG trùng, có thể nhắc liên kết.

Thêm 15 câu trắc nghiệm topic `autotest`, id **qz-autotest-001 → qz-autotest-015** (3 câu `multi: true` có "(Chọn 2)"). Trải đều: locator, wait, POM, JUnit/TestNG, REST Assured, Cucumber, Grid/parallel, flaky, CI, Playwright. Đáp án đúng rải đều vị trí 0–3. `explain` giải thích vì sao đúng **và từng phương án sai sai ở đâu**.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm chưa làm automation, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** vào cuối mảng trong `js/data/quiz-autotest.js`, topic `autotest`, id đúng dải được giao (kiểm tra trùng trước khi ghi). Không sửa mục cũ.
- Đúng schema trắc nghiệm AGENTS.md mục 4; explain 600–1500 ký tự.

## Nghiệm thu
`node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id vào Notes.

## Notes
Reviewed-by: kilo (T647R)
