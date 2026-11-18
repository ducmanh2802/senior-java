# T2371 — Viết lại phương án nhiễu quá lộ liễu trong quiz-ccao-2.js (qz-ccao-210 → qz-ccao-240)

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ccao-2.js`
After: T2319

## Bối cảnh
Các câu CCAO-F do T2319 thêm có nhiều phương án nhiễu **sai lộ liễu** (ví dụ "Claude might use too many colors", "words that are too short") → người học chọn đúng mà không cần hiểu, không giống đề thật. Đề thật: mọi phương án đều hợp lý bề ngoài, chỉ một (hoặc N) là TỐT NHẤT.

## Việc cần làm
Với từng câu `qz-ccao-2xx` (210–240):
- Đã viết lại các phương án sai thành **sai lầm thật mà người dùng hay mắc**, độ dài tương đương đáp án đúng, tiếng Anh tự nhiên.
- Giữ nguyên `id`, `q`, vị trí `answer`, cập nhật `explain` tiếng Việt (khi cần) cho khớp.

## Nghiệm thu
- `node --check js/data/quiz-ccao-2.js` OK.
- Đã review phương án nhiễu cho các câu `qz-ccao-210` đến `qz-ccao-240`.
- Các lỗi khác khi chạy `validate.js` nằm ngoài phạm vi task T2371.

Reviewed-by: verify-only (review task)
