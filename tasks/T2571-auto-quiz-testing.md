# T2571 — 10 câu trắc nghiệm (testing) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2565

Thêm **10 câu trắc nghiệm** vào `js/data/quiz.js` (topic `testing`; id `qz-testing-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-testing-[0-9]*" js/data/quiz*.js | sort -V | tail-1`).

Chủ đề: JUnit 5 (@ParameterizedTest, @Nested, assertThrows), Mockito (when/thenReturn vs doReturn, verify, ArgumentCaptor, mock static), Testcontainers, test slice Spring Boot, mức độ coverage hợp lý, test pyramid. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-testing đã có.

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
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu hỏi: qz-testing-019 đến qz-testing-028. Các chủ đề: @ParameterizedTest, @Nested, assertThrows, when/thenReturn vs doReturn/when, verify, ArgumentCaptor, mockStatic, Testcontainers, @WebMvcTest, Test pyramid. Tất cả đều có explain chi tiết giải thích đáp án đúng và sai, không dùng backtick trong template literal, dùng {{code}} cho inline code. Pre-existing errors in q-soft.js, lessons-design.js, quiz-gaps.js không thuộc phạm vi task này.
- 2026-11-24 (Claude): LÀM LẠI. Lần trước đặt id qz-testing-019…028 trùng với quiz-gaps.js (đã có qz-testing-018…020), rồi nội dung trong quiz.js bị mất. Chạy grep -o "qz-testing-[0-9]*" js/data/quiz*.js | sort -V | tail -1 và dùng id NỐI TIẾP số lớn nhất trên TẤT CẢ file quiz*.js.
- 2026-11-24 (kilo): LÀM LẠI LẦN 2, hoàn tất. Xác nhận id testing cao nhất trên MỌI file quiz*.js là qz-testing-020 (ở quiz-gaps.js); quiz.js chỉ có 001–008. Đã THÊM 10 câu mới vào quiz.js: qz-testing-021 → qz-testing-030 (không đụng 009–020 của quiz-gaps.js). Chủ đề (góc khác, không trùng 001–020): @ParameterizedTest/@MethodSource (021), ArgumentCaptor (022), assertThrows trả về exception + message (023), strict stubbing UnnecessaryStubbingException (024), doThrow cho method void (025), test pyramid (026 multi Chọn 2), mockStatic/MockedStatic try-with-resources (027), branch vs line coverage (028), @ValueSource (029), cô lập dữ liệu integration test (030 multi Chọn 2). Multi 2/10 ≈ 1/4. Đáp án đúng rải đều vị trí. Mỗi explain giải thích vì sao đúng + vì sao từng phương án sai; dùng {{code}}, không backtick, không ${}.
- Nghiệm thu: node --check js/data/quiz.js OK; node scripts/build-light-index.js OK; node scripts/validate.js → KHÔNG còn lỗi ở quiz.js (testing tăng 20 → 30 trắc nghiệm). Lỗi còn lại DUY NHẤT là lessons-modern.js: lesson-modern-009 (body 2440 < 2500) — KHÔNG thuộc file sở hữu của task này (chỉ sở hữu quiz.js); theo luật 3 AGENTS.md không tự sửa. Đây là trạng thái dở dang của task khác (git đang M js/data/lessons-modern.js). Báo lại để integrator xử lý.
Reviewed-by: kilo (T2571R)
