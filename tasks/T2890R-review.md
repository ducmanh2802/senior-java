# T2890R — Fact-check nội dung mới của T2890

Status: TODO
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2890 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi kiến thức đã sửa (js/data/q-java.js — nội dung mới của T2890: core-089, core-090, core-091; chỉ sửa kiến thức, không đổi văn phong/bố cục):
- core-089: sai mặc định StringTableSize — viết "60013 buckets" → sửa thành "65536 buckets" (đã xác thực bằng `java -XX:+PrintFlagsFinal -version` trên JDK 17.0.12: `uintx StringTableSize = 65536 {default}`).
- core-089: Senior tip tham chiếu lệnh `jcmd VM.stringtable` (không tồn tại trong JDK 17) và JFR → sửa thành flag `-XX:+PrintStringTableStatistics` (đã xác thực JVM chấp nhận và in thống kê bảng chuỗi); follow tương ứng đổi "Cách đo hiệu quả intern bằng jcmd?" → "Cách đo hiệu quả intern bằng -XX:+PrintStringTableStatistics?".
- core-090, core-091: đã review kỹ, không sai API/flag/cơ chế nên không sửa.

validate.js: không có lỗi nào trỏ tới q-java.js / core-089, core-090, core-091 (`node --check js/data/q-java.js` OK).

Không đạt `validate.js → OK` đầy đủ do lỗi tiền tồn tại trong file KHÔNG sở hữu của task này (theo AGENTS.md mục 3 không được sửa): `lessons-db.js` lỗi cú pháp `Unexpected identifier 'HashIndexSim'` (làm crash `build-light-index.js` → `index-light.js` không tái sinh được), cùng q-frontend.js, quiz-ops.js, lessons-*, path.js, projects.js, toeic-lr. Các lỗi này nằm ngoài zakres T2890R, ghi vào Notes chứ không tự sửa. Chỉnh sửa của tôi nằm trong `a`/`follow` câu hỏi cũ (không đổi id/topic/level) nên phần câu hỏi trong index-light không thay đổi.

Status: DONE