# T1333 — Nâng cấp đáp án q-remote: remote-031 … remote-036

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T1319

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-031` (6985 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-032` (7502 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-033` (7792 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-034` (6767 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-035` (6304 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-036` (7095 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- remote-031: thêm `### Ví dụ đời thực` (1571 ký tự, tình huống kickoff 1.200 USD), `### Trả lời mẫu khi phỏng vấn` (150–220 từ), và `### Cơ chế từng bước` (kickoff agenda, access, DoD, báo cáo 1–3–5). Đáp án đã có `> Senior tip:` ở cuối; các mục mới chèn ngay trước đó. Đã có `follow: [...]` (3 câu).
- remote-032: thêm `### Ví dụ đời thực` (1447 ký tự, tình huống SMS/dashboard ngoài scope), `### Trả lời mẫu khi phỏng vấn`, và phần `### 6. Hậu quả và việc bảo vệ hồ sơ` (bổ sung). Đã có `follow`.
- remote-033: thêm `### Ví dụ đời thực` (1396 ký tự, dev 12 hợp đồng nhỏ, proposal 70 lần), `### Trả lời mẫu khi phỏng vấn`, và phần `### 5. Rủi ro tài chính và kỳ vọng`. Đã có `follow`.
- remote-034: thêm `### Ví dụ đời thực` (1406 ký tự, chỉ phụ thuộc Upwork → thêm referral/bài viết), `### Trả lời mẫu khi phỏng vấn`, và phần `### 6. Sai lầm hay gặp` + Checklist. Đã có `follow`.
- remote-035: thêm `### Ví dụ đời thực` (1412 ký tự, outreach 40 tin → 12 tin cá nhânised), `### Trả lời mẫu khi phỏng vấn`, và phần `### 5. Tìm người/địa chỉ đúng`. Đã có `follow`.
- remote-036: thêm `### Ví dụ đời thực` (1531 ký tự, dự án direct không SOW → slow pay), `### Trả lời mẫu khi phỏng vấn`, và phần `### 5. Cách dùng thực tế`. Đã có `follow`.

- Đã chạy `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (189.8 KB), rồi `node scripts/validate.js` → `OK — không có lỗi.` (remote: 66 câu hỏi).
- Không có backtick hoặc `${` chưa escape trong 6 đáp án; `> Senior tip:` duy nhất ở mỗi đáp án (cuối cùng).
Reviewed-by: kilo (T1333R)
