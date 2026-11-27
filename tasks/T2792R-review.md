# T2792R — Fact-check nội dung mới của T2792

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2792 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 câu hỏi mới (devops-213, devops-214, devops-215) trong q-devops.js:

**devops-213 (CI monorepo 40 module):**
- Sửa flag Gradle `--affected-modules` không tồn tại → thay bằng "configuration cache + plugin `gradle-git-changes` hoặc script git diff tùy chỉnh"
- Sửa "Maven reactor cache" (không có feature này) → "Maven local repository cache (~/.m2) và Maven Daemon (mvnd)"
- Sửa `gradle-test-retry` (dùng cho retry flaky test, không phải test splitting) → "test sharding"
- Sửa thuật ngữ "distributed cache" → "remote build cache"
- Điều chỉnh số liệu ví dụ: "95% cache hit" → "cache hit cao", "8 phút" → "~8 phút" (tránh số liệu vô căn cứ)

**devops-214 (Java container image):**
- Sửa "Eclipse Temurin JRE Alpine" (Temurin không cung cấp Alpine JRE chính thức) → "Alpine-based JRE (ví dụ BellSoft Liberica Alpine)" tách riêng
- Sửa "phỏng interviewing" (tiếng Anh lẫn vào) → "phỏng vấn"

**devops-215 (Golden signals & burn rate):**
- Không có lỗi kỹ thuật (burn rate 14.4x cho 5m window, 6x cho 1h window, alert fire khi cả hai vượt ngưỡng — đúng theo Google SRE workbook)

Chạy `node scripts/build-light-index.js` để cập nhật index-light.js. Validate không còn lỗi liên quan q-devops.js.
