# T2798R — Fact-check nội dung mới của T2798

Status: DONE
Agent: opencode
Owns: `js/data/lessons-modern.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2798 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-modern-014: Đổi bài tập từ pattern matching switch (Java 21, cần --enable-preview) sang instanceof pattern (Java 16+) để compile được trên Java 17. Cập nhật prompt, reference, hints, explain cho phù hợp.
- lesson-modern-015: Mở rộng body từ ~1992 ký tự lên ≥2500 ký tự (thêm chi tiết về Collector.of, parallel stream 3 điều kiện, boxing/object trung gian, JMH, ví dụ đời thực). Xoá 2 section trùng lặp ("Ví dụ đời thực", "Liên hệ phỏng vấn"). Sửa markup inline code từ backtick sang {{...}}. Sửa reference solution Collector.of dùng lambda supplier thay method reference để tránh lỗi type inference. Thêm test case thứ 3 để đáp ứng yêu cầu ≥3 test.
- index-light.js vẫn báo cũ do lessons-api.js có lỗi cú pháp sẵn có (không thuộc task này) chặn build-light-index.js.
