# T1350 — Nâng cấp đáp án q-devops: devops-043 … devops-048

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1339

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-043` (4668 ký tự): thiếu Ví dụ đời thực
- `devops-044` (5130 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-045` (4211 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-046` (4390 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-047` (4023 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-048` (4705 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `devops-043`: thêm `### Ví dụ đời thực` (connection storm khi rolling update, quá tải max_connections, điều tra pg_stat_activity/Hikari, xử lý ngắn/dài hạn). Giữ mục "Trả lời phỏng vấn 30 giây" hiện có (không thêm Trả lời mẫu trùng). `follow` đã có.
- `devops-044`: thêm `### Ví dụ đời thực` (startup 90–120s, HPA/rollout chậm, đo bằng actuator startup + events) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
- `devops-045`: thêm `### Ví dụ đời thực` (breaking change amount/fee/validation trong rolling update, contract testing) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
- `devops-046`: thêm `### Ví dụ đời thực` (pilot Istio mTLS/STRICT, retry chồng, overhead đo được) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
- `devops-047`: thêm `### Ví dụ đời thực` (upgrade lệch 3 minor, PDB/apiVersion/addon vỡ, chương trình release train) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
- `devops-048`: thêm `### Ví dụ đời thực` (FinOps right-size, minReplicas, dev/test, cost/1.000 transactions, giữ SLA payment) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
- Kiểm tra: `node --check js/data/q-devops.js` OK. `node scripts/build-light-index.js` và `node scripts/validate.js` hiện **không đạt OK** do lỗi cú pháp/thiếu dữ liệu pre-existing ngoài phạm vi task trong `js/data/lessons-jpa.js`, `lessons-microservices.js`, `lessons-db.js`, `lessons-sql.js`, `lessons-testing.js`, `lessons-devops.js`, `projects.js` (dẫn tới path/index-light lỗi) — không thuộc file sở hữu, không chỉnh sửa theo luật task. Chỉ `js/data/q-devops.js` và file task này được thay đổi.
Reviewed-by: kilo (T1350R)
