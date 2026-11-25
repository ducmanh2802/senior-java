# T2733 — 10 câu trắc nghiệm (autotest) vào quiz-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-autotest.js`
After: T2662

Đã thêm 10 câu trắc nghiệm vào `js/data/quiz-autotest.js` (topic `autotest`), id nối tiếp từ qz-autotest-060:
qz-autotest-061 (locator Selenium: tránh XPath tuyệt đối), qz-autotest-062 (FluentWait polling/ignore exception), qz-autotest-063 (Page Object kế thừa BasePage), qz-autotest-064 (RestAssured multipart upload), qz-autotest-065 (queryParam vs pathParam, multi Chọn 2), qz-autotest-066 (ma trận CI Chrome/Firefox), qz-autotest-067 (flaky do shared state/thứ tự chạy, multi Chọn 2), qz-autotest-068 (Allure @Severity + epic/feature/story, multi Chọn 2), qz-autotest-069 (Chrome headless mới), qz-autotest-070 (Selenium chuyển tab qua window handles).
3 câu multi (≈1/4), đáp án rải đều vị trí, explain viết lại sai của từng phương án, tiếng Việt có dấu đầy đủ, không backtick, không `${`.

Xác thực: `node --check js/data/quiz-autotest.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không báo lỗi nào trong `quiz-autotest.js` (các LỖI còn lại của repo nằm trong quiz-ops.js, lessons-jpa.js… — file không thuộc sở hữu task này, không được touche theo luật 3 AGENTS.md).

## Notes
Reviewed-by: kilo (T2733R)
