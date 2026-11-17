# T2333R — Fact-check nội dung mới của T2333

Status: CANCELLED
Agent: opencode
Owns: `js/data/quiz-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2333 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes

Fact-check nội dung mới (qz-autotest-031 → 050): **không có lỗi kiến thức, markup hay chữ nước ngoài**. Kiểm tra kỹ từng câu:
- JUnit 5 lifecycle, @ParameterizedTest, @Nested, Mockito Strict Stubs/ArgumentCaptor/@Mock/@Spy: đúng.
- Spring Boot 3.1+ Testcontainers (@ServiceConnection, static singleton, so sánh H2), @DataJpaTest vs @SpringBootTest: đúng.
- Test Pyramid, E2E chậm/giòn, flaky (shared state, race condition), Contract Test (Pact/Spring Cloud Contract): đúng.
- System.currentTimeMillis() → Clock, cleanup data sau mỗi test: đúng.
- Playwright concepts (Locator, getByTestId, frameLocator, route, storageState, tracing, sharding, APIRequestContext): đúng, không có lỗi.

Validate: `node scripts/validate.js` → OK đối với file sở hữu (`node --check js/data/quiz-autotest.js` → SYNTAX_OK). Lỗi `quiz-ccao-2.js: missing ) after argument list` thuộc file khác (T2288+, không phải sở hữu của T2333R), không tự sửa theo luật 3.
