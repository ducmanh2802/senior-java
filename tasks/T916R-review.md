# T916R — Fact-check nội dung mới của T916

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T916 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- So sánh `git diff HEAD -- js/data/q-kotlin.js`: 10 câu mới/thay đổi trong task T916 là `kotlin-008..010,019..026` (HEAD có các id này nhưng nội dung khác; phần còn lại không chạm). Kiểm tra kỹ thuật/markup: không có backtick lẻ trong template literal `a`, không có `${`, không bịa API rõ ràng, `node --check` OK, `node scripts/validate.js` → `OK — không có lỗi.` (không chạy `test-lessons.js` vì không sửa bài học).
- `kotlin-026`: sửa lỗi chính tả/tiếng lẫn `Miền domaine mới` → `Miền nghiệp vụ (domain) mới`.
- `kotlin-021` (null safety/platform type): giải thích thuật ngữ nullability/NPE lần đầu; thay `String!`/`@Nullable/@NotNull` bằng `{{...}}` và làm rõ mức hỗ trợ chú thích nullability phụ thuộc trình biên dịch/cấu hình (`-Xjsr305`, JSpecify `org.jspecify.annotations`) — tránh khẳng định tuyệt đối “compiler biết chính xác”.
- `kotlin-025` (Flow vs Reactor/WebFlux): làm rõ cơ chế cold stream/backpressure (`collect` là suspend), sửa ví dụ đời thực cho đúng bối cảnh server/SSE (client ngắt kết nối, controller trả `Flow`/bridge `Flux`) thay vì mô tả sai kiểu UI `lifecycleScope` trên backend Spring; thêm `{{...}}` cho thuật ngữ/code và lưu ý conflation/buffer giới hạn.
- `kotlin-008,009,019,020,022,023,024,026`: rà soát kỹ thuật — không phát hiện API/flag bịa hay cơ chế ngược với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x; giữ nguyên cấu trúc/mục, chỉ sửa các điểm nêu trên. Các ví dụ đời thực có số liệu mang tính minh họa (không thêm số liệu vô căn cứ mới).
