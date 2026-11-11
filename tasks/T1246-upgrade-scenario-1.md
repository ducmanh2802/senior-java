# T1246 — Nâng cấp đáp án q-scenario: scenario-002 … scenario-034

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-002` (1999 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-025` (3699 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu, thiếu follow
- `scenario-028` (3281 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-032` (1681 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-033` (1773 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-034` (1324 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `scenario-002`: đã có "### Ví dụ đời thực" và "### Trả lời mẫu khi phỏng vấn" (follow đủ). Bổ sung thêm "### Cơ chế từng bước" (giải thích OFFSET vs keyset, chi phí, cursor ghép cột) để đạt ~4552 ký tự; các mục mới chèn ngay trước `> Senior tip:`. Không xoá nội dung cũ.
- `scenario-025`: đã có "### Ví dụ đời thực" và "### Trả lời mẫu khi phỏng vấn" (follow đủ). Không thêm mục mới (đã đủ), giữ nguyên ~5293 ký tự.
- `scenario-028`: đã có "### Ví dụ đời thực" và "### Trả lời mẫu khi phỏng vấn" (follow đủ). Không thêm mục mới, giữ nguyên ~5298 ký tự.
- `scenario-032`: đã có đủ "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", follow. Bổ sung "### Cơ chế chi tiết sau failover" (DNS cache Java, connection pool giữ kết nối chết, ví dụ cụ thể) để đạt ~5116 ký tự; chèn trước `> Senior tip:`.
- `scenario-033`: đã có đủ "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", follow. Bổ sung "### Cơ chế chi tiết từng nguyên nhân" (arena glibc, direct memory, thread stack, Metaspace) để đạt ~4402 ký tự; chèn trước `> Senior tip:`.
- `scenario-034`: đã có đủ "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", follow. Bổ sung "### Cơ chế chi tiết" (TOCTOU) để đạt ~3957 ký tự; chèn trước `> Senior tip:`.
- Kiểm tra: `node --check js/data/q-scenario.js` OK; load VM kiểm tra 6 id đều có Ví dụ đời thực, Trả lời mẫu, follow>=2, không có backtick/unescaped `${` trong `a`.
- `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (lỗi q-microservices.js đã được xử lý trước đó, không nằm trong quyền sở hữu task này).
- `node --check js/data/q-scenario.js` OK; 6 id đều có Ví dụ đời thực, Trả lời mẫu, follow>=2, không có backtick/unescaped `${` trong `a`.
- Nội dung đã có trong file từ lần chạy trước, giữ nguyên, không xoá.
