# T2662 — 10 câu trắc nghiệm (autotest) vào quiz-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-autotest.js`
After: T2333

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-autotest.js` (topic `autotest`; id `qz-autotest-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-autotest-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Selenium/Playwright: locator ổn định, explicit wait vs implicit wait, Page Object Model, test API bằng RestAssured, chạy song song, flaky test, báo cáo Allure, tích hợp CI. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-autotest đã có.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 10 câu: `qz-autotest-051` … `qz-autotest-060` (nối tiếp số lớn nhất 050).
- Chủ đề: implicit vs explicit wait (051), explicit wait/elementToBeClickable (052), PageFactory/@FindBy trong POM (053), RestAssured extract().path() (054), Allure @Step/@Attachment (055), tích hợp CI (056), JUnit 5 parallel & shared state (057), StaleElementReferenceException (058), Selenium Grid/RemoteWebDriver (059), RestAssured matchesJsonSchema + Hamcrest (060).
- 3 câu `multi: true` (055, 056, 060 ~ 1/4); đáp án đúng rải đều vị trí (2,0,3,1 / [0,1] / [0,2] / 2 / 1 / 3 / [0,2]).
- Mỗi explain: có **Tóm tắt**, giải thích từng bước (cái gì → vì sao → hoạt động → ví dụ code/số liệu), ví dụ Java/bash, lỗi hay gặp, Senior tip, và mục "vì sao các phương án còn lại sai".
- Nội dung tiếng Việt có dấu, dùng {{code}} và ~~~code~~~, không backtick, không ${.
- `node --check js/data/quiz-autotest.js` → OK. `node scripts/build-light-index.js` → ghi index-light.js. `node scripts/validate.js` → file của tôi KHÔNG có lỗi (autotest 50→60, không có lỗi/warning nào gắn id qz-autotest-*). Các lỗi validate còn lại nằm ở `quiz-java.js` và `quiz-ops.js` (file của task khác, không thuộc sở hữu T2662) nên không sửa theo luật 3 AGENTS.md.
- Không commit.
Reviewed-by: kilo (T2662R)
