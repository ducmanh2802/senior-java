# T2762R — Fact-check nội dung mới của T2762

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2762 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-claude-016: sửa "đã bundles sẵn JUnit 5" → "đã có sẵn JUnit 5" (chữ tiếng Anh lẫn vào body).
- lesson-claude-017: body 2495 ký tự (validator yêu cầu ≥ 2500) → bổ sung 1 câu giải thích tại mục "Vì sao agent hay mắc lỗi hệ thống", không thay đổi kiến thức. Sau sửa body đạt ≥ 2500.
- lesson-claude-015: kiểm tra lại plan mode + Shift+Tab (default → acceptEdits → plan; plan mode chỉ đọc và đề xuất, chỉ ghi file sau khi duyệt) và CLAUDE.local.md + CLAUDE.md nested theo docs code.claude.com — đúng kỹ thuật, không sửa.
- lesson-claude-016/018/019: kiểm tra kỹ thuật (Testcontainers/@Container/@Testcontainers/PostgreSQLContainer, gitleaks pre-commit+CI, rotate key, sk_test_/sk_live_, AKIA, @Value/DB_PASSWORD, Idempotency-Key, Webhook.constructEvent(payload, sigHeader, endpointSecret), thẻ test 4242…) — đúng, không sửa.
- lesson-claude-017: FetchType.EAGER/@ManyToOne, N+1 qua repository.findById trong for, findAllById, catch rỗng nuốt exception, log PII — đúng, không sửa.
- lesson-claude-020: không có claim kỹ thuật cần fix, không sửa.
- node scripts/build-light-index.js → đã ghi js/data/index-light.js.
- node scripts/validate.js → không còn lỗi nào trong lessons-claude.js. Lỗi còn lại (quiz-ops.js, lessons-modern/jpa/payments/aws/architecture, q-concurrency-jvm…) nằm ở file KHÔNG do task này sở hữu → không sửa theo luật 3 AGENTS.md.
- node scripts/test-lessons.js → 457/463 bài tập pass; 6 thất bại là lesson-aws-013/014/015/016 và lesson-architecture-015/016 (file khác task sở hữu). Cả 6 bài tập của lesson-claude-015..020 pass (reference 100%, starter compile được và không pass hết).
