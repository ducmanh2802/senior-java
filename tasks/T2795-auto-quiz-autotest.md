# T2795 — 10 câu trắc nghiệm (autotest) vào quiz-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-autotest.js`
After: T2733

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-autotest.js` (topic `autotest`; id `qz-autotest-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-autotest-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Selenium/Playwright: locator ổn định, explicit wait vs implicit wait, Page Object Model, test API bằng RestAssured, chạy song song, flaky test, báo cáo Allure, tích hợp CI. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-autotest đã có.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 10 câu (vòng 3, chọn góc chưa có trong file): qz-autotest-071 (bắt pageerror/console error để fail test khi trang có lỗi JS), 072 (expect.poll chờ điều kiện async không gắn locator), 073 (Selenium Actions: hover/drag-drop, không auto-wait/đọc text), 074 (Select.selectByVisibleText/Value/Index), 075 (getByLabel theo nhãn form - accessibility), 076 (context.grantPermissions + setGeolocation, quyền thuộc context, headless vẫn được), 077 (RestAssured auth().oauth2 Bearer token), 078 (Testcontainers Ryuk resource reaper), 079 (workers trong 1 máy vs sharding nhiều máy; fullyParallel độc lập), 080 (setInputFiles cho input type=file).
- 3/10 câu multi (073, 076, 079) ~ đúng tỉ lệ 1/4; đáp án đúng rải đều vị trí: 071=1,072=2,073=[0,1],074=1,075=3,076=[0,1],077=2,078=2,079=[0,2],080=3. Không trùng nội dung câu cũ.
- `node --check js/data/quiz-autotest.js` → OK (CHECK_OK). Không có backtick/`${` trong template literal (đã grep xác nhận).
- `node scripts/validate.js`: autotest parse đủ 80 trắc nghiệm, KHÔNG có lỗi nào thuộc quiz-autotest.js.
- `node scripts/build-light-index.js` hiện BÁO LỖI ở file KHÔNG thuộc task này: js/data/lessons-collections.js:3725 (backtick quanh `now`/`duration` làm vỡ template literal) → chặn build index-light và validate path.js. Theo AGENTS.md luật 3, KHÔNG sửa file người khác; đề xuất integrator/T2794 xử lý lessons-collections.js rồi chạy lại build-light-index + validate để OK hoàn toàn.
Reviewed-by: kilo (T2795R)
