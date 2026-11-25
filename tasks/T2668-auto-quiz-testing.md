# T2668 — 10 câu trắc nghiệm (testing) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2652

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `testing`; id `qz-testing-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-testing-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: JUnit 5 (@ParameterizedTest, @Nested, assertThrows), Mockito (when/thenReturn vs doReturn, verify, ArgumentCaptor, mock static), Testcontainers, test slice Spring Boot, mức độ coverage hợp lý, test pyramid. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-testing đã có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu trắc nghiệm testing: qz-testing-031 đến qz-testing-040.
- qz-testing-031: @ParameterizedTest behavior khi một tham số fail
- qz-testing-032: @Nested class lifecycle @BeforeEach/@AfterEach cascade
- qz-testing-033: assertThrows syntax đúng
- qz-testing-034 (multi): when/thenReturn vs doReturn/when
- qz-testing-035: verify với timeout và times
- qz-testing-036: ArgumentCaptor usage
- qz-testing-037: Mockito.mockStatic try-with-resources
- qz-testing-038: Testcontainers @Container static field
- qz-testing-039: @DataJpaTest + Testcontainers config
- qz-testing-040 (multi): Test Pyramid và coverage thực tế
Reviewed-by: kilo (T2668R)
