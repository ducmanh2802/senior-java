# T2874R — Fact-check nội dung mới của T2874

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2874 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức trong nội dung mới của T2874 (các mục `qz-frontend-063` … `qz-frontend-082` trong `js/data/quiz-gaps.js`). Đã fact-check toàn bộ 20 mục (Vue 3 Composition API: ref/reactive, computed/watch/watchEffect, v-for key, lifecycle; Axios refresh-token queue; CORS preflight với Spring Security 6; SPA fallback với Spring Boot) — các khẳng định kỹ thuật đều đúng, không có API/flag bịa, không có mặc định sai, không lẫn chữ nước ngoài, markup `{{...}}`/`(Chọn 2)`/answer tăng dần hợp lệ.

`node scripts/validate.js`: KHÔNG báo lỗi nào cho `quiz-gaps.js`. Các lỗi còn lại (q-sql.js, q-frontend.js, quiz-ops.js, lessons-jpa.js, lessons-payments.js, lessons-modern.js, toeic-lr) thuộc file của task khác, ngoài phạm vi sở hữu của task này — không sửa.
