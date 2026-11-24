# T2571R — Fact-check nội dung mới của T2571

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2571 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fact-check 10 câu MỚI của T2571 trong quiz.js: thực tế là qz-testing-021..030 (quiz.js trước có 001–008; quiz-gaps.js giữ 009–020 — không đụng). Đã đọc kỹ cả 10.
- qz-testing-022 (ArgumentCaptor): SỬA 1 lỗi — câu "Từ Mockito 5 còn có @Captor" sai (annotation @Captor đã có từ Mockito 1.x, không phải Mockito 5). Đổi thành "Mockito còn có annotation @Captor để inject captor thay vì tự tạo". Nội dung kỹ thuật còn lại đúng (capture + getAllValues, dùng cho mọi method không riêng void).
- qz-testing-021 (@ParameterizedTest/@MethodSource), 023 (assertThrows trả về exception + getMessage), 024 (strict stubbing UnnecessaryStubbingException), 025 (doThrow cho void), 026 (test pyramid multi), 027 (mockStatic/MockedStatic try-with-resources, Mockito 3.4+), 028 (branch vs line coverage JaCoCo), 029 (@ValueSource in 1 2), 030 (cô lập dữ liệu integration test, @Transactional rollback + lưu ý RANDOM_PORT) — không có lỗi kiến thức/markup, không có backtick/${} trong template literal, không lẫn chữ nước ngoài.
- Nghiệm thu: node --check js/data/quiz.js OK; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi. Các cảnh báo còn lại (concurrency/jvm/db đáp án ngắn, lessons không nằm trong PATH) đều NGOÀI phạm vi file sở hữu.
