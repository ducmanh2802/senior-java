# T1450R — Fact-check nội dung mới của T1450

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1450 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1450 (`git diff HEAD -- js/data/q-devops.js`): phần mới là bổ sung 2 mục `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` vào các câu hiện có `devops-076`, `devops-077`, `devops-078`, `devops-079` (không thêm/xoá mục/câu).
- Kiểm tra kỹ thuật/markup: lệnh kubectl/system/network, khái niệm CrashLoopBackOff/Exit Code/cordon, expand-contract blue-green, latency migrate (tracing/DNS/VPN/HikariCP), 7R/wave planning/go-no-go đều hợp lý; số liệu dạng ví dụ minh hoạ nhất quán; dùng `{{...}}`, `~~~seq` đúng quy ước; không thấy backtick hay `${` không escape trong phần mới; không phát hiện API/flag bịa hay cơ chế sai.
- Không có lỗi kiến thức cần sửa. `node --check js/data/q-devops.js` OK. `node scripts/validate.js` → OK (chỉ cảnh báo sẵn có: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`). Không chạy `test-lessons.js` vì task không sở hữu/sửa bài học. Chỉ sửa `js/data/q-devops.js` (không thay đổi nội dung) và `tasks/T1450R-review.md`.
