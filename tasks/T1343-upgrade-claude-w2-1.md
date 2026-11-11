# T1343 — Nâng cấp đáp án q-claude: claude-037 … claude-042

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T1332

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `claude-037` (3898 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-038` (3961 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-039` (3521 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-040` (4083 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-041` (4177 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-042` (4151 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `claude-037` (mid): đã có sẵn `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` + `follow` (3 câu) từ lần chạy trước; nội dung đáp án đạt chuẩn, đặt ngay trước `> Senior tip:`. Sửa markup: thay backtick thành `{{}}` và khắc phục lỗi inline code lồng `{}` do thay thế (giữ cú pháp hợp lệ cho `App.md`/validator).
- `claude-038` (senior): đã có sẵn `### Ví dụ đời thực` + `### Trả lời mẫu` + `follow` (3 câu); sửa markup backtick/nested `{{}}` tương tự, giữ nội dung đúng kỹ thuật.
- `claude-039` (lead, golden set/eval): thêm `### Ví dụ đời thực` (triệu chứng tỉ lệ sửa tay 6%→18%, điều tra slice tiếng Anh dài, nguyên nhân golden set không đại diện + đổi đồng thời prompt/model, xử lý mở rộng/version golden set + A/B tách biến + smoke/full eval, kết quả nhóm dài phục hồi 93%, sửa tay 7%) và `### Trả lời mẫu khi phỏng vấn` (đoạn nói tự nhiên ~170 từ) ngay trước `> Senior tip:`. `follow` đã có (3 câu). Không đụng nội dung cũ.
- `claude-040` (senior, debug tool/JSON): thêm `### Ví dụ đời thực` (12% không gọi tool bịa số liệu, 3% JSON parse lỗi; điều tra request/response thô, stop_reason max_tokens; xử lý ràng buộc tool + kiểm tra server, lấy đúng block text + structured outputs; kết quả 0,8%/0,1%) và `### Trả lời mẫu` (~170 từ) trước `> Senior tip:`. `follow` đã có.
- `claude-041` (lead, agent eval/LLM-as-judge): thêm `### Ví dụ đời thực` (220 ca mô phỏng: 7 ca refund sai, 11 ca bịa ngày; judge đồng thuận 78%→91% sau chỉnh rubric; chặn cứng refund + cấm số liệu không có tool call; deploy 10% shadow/A/B; kết quả refund sai 0, bịa 0,4%, đồng thuận 90%) và `### Trả lời mẫu` trước `> Senior tip:`. `follow` đã có.
- `claude-042` (lead, incident loop/sai tool): thêm `### Ví dụ đời thực` (chi phí x10/45 phút, 22% chạm bước, 3 đơn huỷ sai; cầm máu gỡ `cancel_order`, hạ MAX_STEPS/ngân sách; điều tra transcript lặp `get_order` + `is_error failed` sau deploy; xử lý lỗi có hướng dẫn + phát hiện lặp + approval gate; kết quả MAX_STEPS 1,2%, không huỷ sai) và `### Trả lời mẫu` trước `> Senior tip:`. `follow` đã có.
- Chỉ sửa `js/data/q-claude.js` (và `js/data/index-light.js` do build script). Không commit, không mở trình duyệt, không kill process theo tên.
- Kiểm tra: `node --check js/data/q-claude.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn 2 cảnh báo sẵn có không liên quan: `claude-034.a` HTML thô, `path.js` 2 bài học ngoài PATH).
Reviewed-by: kilo (T1343R)
