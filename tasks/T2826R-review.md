# T2826R — Fact-check nội dung mới của T2826

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2826 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check 10 câu mới của T2826 (qz-kotlin-041..050) trong js/data/quiz-java.js. Nội dung Kotlin đúng (null safety, by lazy, data class, sealed class, coroutine runBlocking/async/coroutineScope/supervisorScope, @JvmName, copy()). Đối chiếu sealed class với Kotlin spec: sealed là abstract ngầm và 2 modifier sealed/abstract loại trừ nhau, nên parenthetical "không thể inner, abstract" của qz-kotlin-045 là ĐÚNG, không sửa.

Lỗi kỹ thuật đã sửa:
- qz-kotlin-041: explain nói sai rằng chế độ {{PUBLICATION}} "tính lại mỗi lần truy cập". Thực tế mọi LazyThreadSafetyMode (SYNCHRONIZED/PUBLICATION/NONE) đều tính 1 lần rồi lưu; PUBLICATION chỉ cho nhiều luồng cùng khởi tạo ở lần đầu rồi dùng lại giá trị đã lưu. Đã viết lại câu giải thích phương án sai cho đúng.

Không sửa nội dung đã có ở HEAD, không thêm/xoá mục. node --check OK; build-light-index OK; validate.js không báo lỗi nào từ quiz-java.js/qz-kotlin-* (các lỗi còn lại ở quiz-ops.js, lessons-*.js thuộc task khác, không sửa theo luật 3 AGENTS.md).
