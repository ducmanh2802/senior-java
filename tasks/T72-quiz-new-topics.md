# T72 — Nội dung: trắc nghiệm cho các chủ đề mới (sql, api, security, behavioral, english)

Status: TODO
Agent: opencode
Owns: `js/data/quiz.js`

> **Ghi theo lô nhỏ:** thêm **3 câu mỗi lần edit**. Sau mỗi lô chạy `node --check js/data/quiz.js` và `node scripts/validate.js quiz.js`.

Đọc `AGENTS.md` mục 4 (schema QUIZ), 5 (markup) và 6 (chất lượng) trước. **Chỉ THÊM vào cuối mảng**, không sửa câu cũ.

## Mục tiêu
Mỗi topic dưới đây hiện chưa có câu trắc nghiệm nào. Thêm **8 câu mỗi topic**, ID dạng `qz-<topic>-001`… :
- `sql`: đọc một câu SQL ngắn (đặt trong `~~~sql` ở `q`) và chọn kết quả đúng: NULL trong NOT IN, COUNT(*) vs COUNT(col), RANK vs DENSE_RANK, LEFT JOIN + điều kiện ở WHERE vs ON, GROUP BY/HAVING, window frame mặc định.
- `api`: chọn status code đúng cho tình huống, PUT vs PATCH vs POST (idempotent), CORS preflight, ETag/If-Match, 202 Accepted.
- `security`: JWT (HS256 vs RS256, nơi lưu token), lưu mật khẩu (bcrypt/argon2), CSRF + SameSite, IDOR, SQL injection qua ORDER BY, mTLS.
- `behavioral`: chọn cách trả lời tốt nhất theo STAR cho tình huống (xung đột, trễ deadline, feedback khó) — 3 phương án sai phải là lỗi ứng viên hay mắc thật.
- `english`: chọn câu tiếng Anh tự nhiên/đúng ngữ pháp nhất trong phỏng vấn (giải thích trade-off, nói "không biết", hỏi lại câu hỏi), giải thích bằng tiếng Việt vì sao 3 câu kia sai.

## Yêu cầu chất lượng
- Đúng 4 options, **chỉ một đáp án đúng và không thể cãi**, các phương án sai phải hợp lý (lỗi thường gặp), không trùng nhau. Đáp án đúng rải đều vị trí 0–3.
- `explain` giải thích vì sao đúng **và vì sao từng phương án sai là sai**; câu SQL phải chạy được trên PostgreSQL 15.
- Không bịa API/số liệu; không viết lẫn ngôn ngữ khác (validator sẽ chặn chữ Trung/Nga).

## Nghiệm thu
`node scripts/validate.js` → OK, mỗi topic trên có 8 câu trắc nghiệm. Integrator sẽ fact-check.

## Notes
