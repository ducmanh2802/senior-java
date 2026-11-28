# T2907R — Fact-check nội dung mới của T2907

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2907 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 lỗi kỹ thuật trong các câu hỏi mới (qz-ccap-381 đến qz-ccap-420):

1. **qz-ccap-414**: Sửa sai lệch về tham số API. Câu hỏi gốc nói "newest Claude models" từ chối `budget_tokens, temperature, top_p, top_k, prefill` — không chính xác. Thực tế: chỉ khi bật **extended thinking** (`thinking: {type: "enabled", budget_tokens: N}`) thì `temperature, top_p, top_k` mới bị 400; `budget_tokens` không phải tham số top-level, `prefill` dùng qua assistant message. Đã viết lại câu hỏi/hỏi đáp tập trung vào trường hợp thinking enabled.

2. **qz-ccap-415**: Sửa tên model "Claude 5.x" → "Claude 3.5/3.7 Sonnet, Opus 4" (tên model thực tế hiện tại). Sửa context window "1M-token" → "200K-token" (giá trị công khai chuẩn).

3. **qz-ccap-417**: Sửa "Haiku 5.5" → "Haiku 3.5" (model thực tế).

4. **qz-ccap-418**: Sửa sai lệch về prompt caching TTL. Anthropic chỉ có TTL 5 phút cố định, không có tùy chọn 1 giờ. Đã viết lại câu hỏi/hỏi đáp phản ánh đúng TTL 5 phút và write premium.

Lưu ý: `node scripts/validate.js` báo lỗi `quiz-ccdv-1.js: missing ) after argument list` và `index-light.js đã cũ` — đây là lỗi sẵn có ở file **không thuộc sở hữu task này** (theo AGENTS.md §3, task chỉ sở hữu `quiz-ccap-1.js`). Không được sửa file người khác; đã ghi nhận ở đây để integrator xử lý.
