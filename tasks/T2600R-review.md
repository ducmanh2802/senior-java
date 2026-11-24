# T2600R — Fact-check nội dung mới của T2600

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2600 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 10 câu hỏi mới (qz-frontend-033 đến qz-frontend-042) trong quiz-gaps.js. Tất cả đều đúng kỹ thuật về Vue 3 (ref unwrap trong template, watch vs watchEffect, v-for key, cleanup interval, JWT refresh token queue, CORS preflight OPTIONS, SPA fallback, v-show vs v-if, provide/inject, Teleport). Không có lỗi markup, không có backtick/${ trong template literal. Các lỗi validate hiển thị là lỗi sẵn có ở file khác (sd-problems.js, quiz-java.js, quiz-ops.js), không liên quan task này.
