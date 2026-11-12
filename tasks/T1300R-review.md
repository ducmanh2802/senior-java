# T1300R — Fact-check nội dung mới của T1300

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1300 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD vs working tree của `js/data/q-scenario.js`: nội dung mới là 6 mục `### Ví dụ đời thực` được thêm cho `scenario-058`..`scenario-063` (@Async/SecurityContext+MDC, OSIV/N+1, singleton bean thread-safety, liveness/startup/readiness probes, graceful shutdown rolling deploy, HPA flapping).
- Kiểm tra kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x, K8s): không thấy API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ. Các điểm đã đối chiếu: ThreadLocal/TaskDecorator và cần clear trong finally, OSIV giữ EntityManager suốt request + N+1 khi serialize, singleton bean chia sẻ mutable field/`SimpleDateFormat` vs `DateTimeFormatter`, startupProbe che giai đoạn khởi động và liveness/readiness tách vai trò, preStop+graceful shutdown+`terminationGracePeriodSeconds`/`maxUnavailable:0` xử lý race SIGTERM/endpoint, HPA tính theo CPU request với stabilization/behavior và warm-up pod.
- Kiểm tra markup: không có backtick, không có `${` interpolation, dùng `{{ }}` cho inline code, không thay đổi schema/id/câu hỏi, không sửa nội dung đã có ở HEAD.
- `node --check js/data/q-scenario.js` → OK. `node scripts/validate.js` vẫn còn lỗi/cảnh báo sẵn có ở các file khác (lessons-*/projects/path/index-light cũ), không có lỗi nào thuộc `q-scenario.js`. `scripts/test-lessons.js` không liên quan (file sở hữu không phải bài học).
- Kết luận: **không có lỗi kiến thức/markup cần sửa** trong phần mới của T1300.
