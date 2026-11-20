# T2527R — Fact-check nội dung mới của T2527

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2527 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ 10 câu trắc nghiệm mới của T2527 trong js/data/quiz.js (qz-frontend-013 … qz-frontend-022): TypeScript any vs unknown, interface vs type, Vue 3 lifecycle (mounted/created/beforeUnmount) x3, axios interceptor (gắn JWT + xử lý 401), CORS preflight, cache-busting, Vue Router history mode refresh 404, setInterval cleanup.

Kết quả review: không có lỗi kiến thức (kiến thức TypeScript/Vue/axios/CORS đúng), không lỗi markup (không backtick, không ${, khối ~~~text hợp lệ), không chữ nước ngoài lẫn vào ngoài thuật ngữ kỹ thuật giữ nguyên tiếng Anh. Đáp án và multi-index [0,2]/[1,3] chính xác, ID tăng dần 013→022, không thêm/xoá mục, không sửa nội dung HEAD. Không cần sửa gì trong quiz.js.

validate.js: quiz.js sạch (không báo lỗi quiz.js/qz-frontend-*). Tuy nhiên validate tổng thể chưa OK do các lỗi nằm NGOÀI file sở hữu của task (quy tắc 3 AGENTS.md: không được sửa file khác):
- js/data/q-api.js bị lỗi cú pháp trong working tree (không phải tại HEAD, không do task này) → build-light-index.js ném lỗi nạp → index-light.js đã cũ so với dữ liệu.
- lessons-api.js, projects.js, path.js báo tham chiếu id câu hỏi không tồn tại (file không sở hữu, đã lỗi trước).
=> Đề xuất integrator: sửa q-api.js, chạy node scripts/build-light-index.js, sau đó chạy node scripts/validate.js lại.
