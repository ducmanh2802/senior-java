# T1330R — Fact-check nội dung mới của T1330

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1330 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff `js/data/q-scenario.js` (T1330): bổ sung `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` cho scenario-070..075.
- Kiểm tra kỹ thuật (Spring Boot 3.x, virtual threads/JFR `jdk.VirtualThreadPinned`, pinning & JEP 491, HikariCP backpressure, credential stuffing/WAF/Redis, SSRF/IMDSv2/DNS rebinding/egress proxy, secret leak remediation/git-filter-repo/push protection/IRSA, Log4Shell triage/log4j-core vs log4j-to-slf4j/BOM override): không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, số liệu vô căn cứ rõ rệt hay lỗi markup trong phần mới.
- Không có lỗi kiến thức cần sửa trong nội dung mới. `node scripts/validate.js` → OK. `node --check js/data/q-scenario.js` → OK. Không chạy `scripts/test-lessons.js` (không phải bài học). Không git commit/push.
