# T1447R — Fact-check nội dung mới của T1447

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1447 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới thêm vào 6 câu hỏi (autotest-005 đến autotest-011):
- autotest-005: Ví dụ đời thực StaleElementReferenceException trên bảng đơn hàng auto-refresh WebSocket, fix re-locate + retry + elementToBeClickable — đúng kỹ thuật.
- autotest-006: God Page BankingPage 2500 dòng, assert trong page method, fix tách component + POM — đúng.
- autotest-007: TestNG dependsOnMethods tạo chuỗi phụ thuộc skip không fail, JUnit 5 @CsvSource hardcode → @MethodSource đọc JSON — đúng.
- autotest-008: REST Assured schema validation bắt breaking change transactionId→txnId, chain request extract token, schema additionalProperties — đúng.
- autotest-010: Playwright frameLocator, waitForPopup, waitForDownload, setInputFiles, page.route mock API ngân hàng — đúng API.
- autotest-011: storageState tái dùng đăng nhập, JWT expiry 24h fix CI refresh job, bug thật password change không clear localStorage — thực tế và đúng.

Không phát hiện lỗi kỹ thuật, lỗi markup, hay từ lẫn tiếng nước ngoài. validate.js báo OK.
