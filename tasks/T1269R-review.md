# T1269R — Fact-check nội dung mới của T1269

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1269 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (q-kotlin.js passes validation; other file errors are pre-existing). Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi kỹ thuật trong nội dung mới (kotlin-014 đến kotlin-029):

1. **kotlin-018 (line 896)**: Sửa mô tả không chính xác về Spring Framework 6.1 "bỏ cơ chế đọc tên tham số". Thực tế: Spring dùng ParameterNameDiscoverer; Kotlin không sinh tên tham số vào bytecode mặc định (khác Java với `-parameters`). Cần bật `javaParameters = true` để Kotlin đưa tên tham số vào bytecode.

2. **kotlin-024 (line 1231)**: Xoá `kotlin("plugin.allopen")` thừa trong ví dụ Gradle plugins block. Plugin `kotlin("plugin.spring")` đã áp dụng all-open với các annotation Spring; khai báo riêng `plugin.allopen` là dư thừa.

3. **kotlin-025 (line 1277)**: Sửa `Dispatchers.Reactor` không tồn tại. Cầu nối ngữ cảnh (MDC, security, tenant) giữa Flow và Reactor dùng `kotlinx-coroutines-reactor` cung cấp `ReactorContext` và các extension chuyển đổi (`asFlux()`, `asFlow()`); không có `Dispatchers.Reactor`.

Lưu ý: validate.js báo lỗi ở các file khác (q-system-design.js, lessons-testing.js, lessons-architecture.js, projects.js, path.js, index-light.js) nhưng đây là lỗi có sẵn từ HEAD, không thuộc sở hữu task này (chỉ owns q-kotlin.js).
