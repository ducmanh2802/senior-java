# T1378 — Nâng cấp đáp án q-soft: behavioral-041 … behavioral-045

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T1370

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `behavioral-041` (4118 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `behavioral-042` (3839 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `behavioral-043` (3674 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `behavioral-044` (3763 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-041` (5565 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `behavioral-045` (5484 ký tự): thiếu Trả lời mẫu

Với MỖI id ở trên:
1. **Thiếu Ví dụ đời thực** → thêm mục `### Ví dụ đời thực` (700–1200 ký tự): một tình huống production cụ thể, có số liệu, đi theo mạch **triệu chứng → điều tra (lệnh/metric/log cụ thể) → nguyên nhân gốc → cách xử lý → kết quả đo được**. Phải khớp với cơ chế mà đáp án đã giải thích; không bịa API, flag, tham số cấu hình hay tên metric. Không chắc thì viết ít lại nhưng đúng.
2. **Thiếu Trả lời mẫu** → thêm mục `### Trả lời mẫu khi phỏng vấn`: một đoạn văn nói tự nhiên 150–220 từ, ngôi thứ nhất, đặt trong dấu ngoặc kép, như ứng viên Senior trả lời thật (ý chính → cơ chế → trade-off → kinh nghiệm thực tế). Nếu đáp án đã có mục tương đương (ví dụ "Trả lời miệng 1 phút") thì KHÔNG thêm.
3. **Ngắn** (< 3000 ký tự) → bổ sung thêm phần giải thích cơ chế (`### Cơ chế từng bước` hoặc bảng so sánh, pitfall production) để đáp án đạt 3000–5000 ký tự.
4. Chèn các mục mới **ngay trước** dòng `> Senior tip:` (Senior tip luôn ở cuối). Viết tiếng Việt **có dấu đầy đủ**; thuật ngữ kỹ thuật giữ tiếng Anh.
5. **Thiếu follow** → thêm field `follow: [...]` gồm 2–3 câu hỏi đào sâu mà interviewer hay hỏi tiếp.

Luật:
- **Chỉ thêm**, không xoá/viết lại nội dung đã có, không đụng câu hỏi khác ngoài danh sách.
- File rất lớn: **sửa bằng công cụ edit theo từng đoạn nhỏ** (tìm đúng dòng `> Senior tip:` của id đó). **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file nào khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: dùng `{{code}}` cho inline code (không lồng dấu ngoặc nhọn bên trong), `~~~java` cho code block. KHÔNG dùng backtick và `${` trong đáp án.

Nghiệm thu:
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit.
- Ghi `Status: DONE` (sửa dòng Status ở đầu file) + Notes ngắn: id nào thêm mục gì.

## Notes

Đã thêm cho 6 câu hỏi:
- `behavioral-041`: thêm **Ví dụ đời thực** (ứng viên phỏng vấn 4 công ty, dùng bảng so sánh, nhận 2 offer) + **Trả lời mẫu khi phỏng vấn** (4 nhóm câu hỏi, green/red flag, câu hỏi "quyết định kỹ thuật team tranh luận")
- `behavioral-042`: thêm **Ví dụ đời thực** (Senior Java so sánh ngân hàng 35tr vs startup 32tr+ESOP, tính tổng thu nhập năm đầu, chọn ngân hàng) + **Trả lời mẫu khi phỏng vấn** (tính tổng thu nhập, bảng so sánh, walk-away, ESOP không tính năm đầu)
- `behavioral-043`: thêm **Ví dụ đời thực** (dev 3 năm so sánh outsourcing Nhật 28tr vs Âu-Mỹ $1800, hỏi LinkedIn, chọn Nhật vì ổn định) + **Trả lời mẫu khi phỏng vấn** (so sánh ngôn ngữ, múi giờ, hợp đồng, bảo hiểm, rủi ro, tiêu chí chọn)
- `behavioral-044`: thêm **Ví dụ đời thực** (Backend 2 năm vào startup edtech 22tr, lương trễ, OT nhiều, 6 tháng sau portfolio giúp phỏng vấn big tech 40tr) + **Trả lời mẫu khi phỏng vấn** (bảng so sánh, ESOP không tính hàng tháng, câu hỏi quan trọng, walk-away)
- `testing-041`: thêm **Ví dụ đời thực** (Team 350 test H2, 5 sự cố SQL lọt production, chuyển Testcontainers Postgres singleton, CI 4p20s, 0 lỗi 6 tháng) + **Trả lời mẫu khi phỏng vấn** (Ryuk, reuse, singleton, CI song song, số liệu chi phí thực tế)
- `behavioral-045`: thêm **Trả lời mẫu khi phỏng vấn** (thu thập dữ liệu 2-3 sprint, SBI 1-1, tìm nguyên nhân gốc, kế hoạch 4 tuần có KPI, pair programming, leo thang minh bạch, kết quả 40%→78%)

Tất cả chỉnh sửa đều chèn ngay trước `> Senior tip:`. Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1378R)
