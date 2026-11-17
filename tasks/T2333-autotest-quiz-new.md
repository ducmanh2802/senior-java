# T2333 — 20 câu trắc nghiệm kiểm thử tự động mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-autotest.js`
After: T2269

Định dạng QUIZ. Grep `q:` để không trùng. Thêm 20 câu: JUnit 5 (@ParameterizedTest, @Nested, lifecycle), Mockito 5 (strict stubs, ArgumentCaptor, spy bẫy), Testcontainers + @ServiceConnection (Boot 3.1+), @DataJpaTest vs @SpringBootTest, test pyramid, flaky test do thời gian (Clock), contract test. 1/4 multi (Chọn 2), explain vì sao từng phương án sai, đáp án rải đều.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/quiz-autotest.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Đã thêm 20 câu trắc nghiệm kiểm thử tự động (qz-autotest-031 đến qz-autotest-050). Tất cả validation OK.
Reviewed-by: kilo (T2333R)
