# T1345R — Fact-check nội dung mới của T1345

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1345 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- modern-017: "Ví dụ đời thực" bước 4 — thay "Bật Sonar rule {{java:S3959}} (Consumed Stream pipelines should not reuse)" (mã rule cụ thể dễ sai/không khớp ngữ cảnh side-effect {{forEach}}+{{add}}; Sonar S3959 nhắm consumed/reused stream) bằng "Bật rule phân tích tĩnh (Sonar, SpotBugs) cảnh báo side-effect trong stream pipeline…" để giữ đúng ý, tránh bịa mã rule.
- modern-021: "Ví dụ đời thực" bước 2 — thay cờ GC log cũ {{-XX:+PrintGCDetails}} bằng {{-Xlog:gc*:file=gc.log}} (JDK 9+, phù hợp chuẩn Java 17/21 của repo) trong phần hướng dẫn điều tra.
- modern-018, modern-019, modern-020, modern-022: nội dung mới (Ví dụ đời thực) kiểm tra không phát hiện lỗi kỹ thuật/markup/API bịa.
- Kiểm tra: `node --check js/data/q-java.js` OK; `node scripts/validate.js` → OK. (Cảnh báo path.js lesson-design-007 là có sẵn, không thuộc phạm vi task.)
