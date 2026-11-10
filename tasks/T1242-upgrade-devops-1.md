# T1242 — Nâng cấp đáp án q-devops: devops-001 … devops-006

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-001` (6115 ký tự): thiếu Ví dụ đời thực
- `devops-002` (6471 ký tự): thiếu Ví dụ đời thực
- `devops-003` (6446 ký tự): thiếu Ví dụ đời thực
- `devops-004` (7174 ký tự): thiếu Ví dụ đời thực
- `devops-005` (6708 ký tự): thiếu Ví dụ đời thực
- `devops-006` (6765 ký tự): thiếu Ví dụ đời thực

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
- Đã chèn mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được) ngay trước dòng `> Senior tip:` của 6 id: devops-001 (Dockerfile multi-stage/layered jar), devops-002 (JVM trong container/OOMKilled), devops-003 (K8s request path/503), devops-004 (rolling update/502-503), devops-005 (CrashLoopBackOff/Flyway), devops-006 (HPA/custom metric).
- Không thêm `### Trả lời mẫu khi phỏng vấn` vì mỗi đáp án đã có `### Trả lời miệng 1 phút` (quy tắc 2 của task); không thêm `follow` vì từng id đã có field `follow` 2–3 câu. Các đáp án đều > 3000 ký tự nên không bổ sung phần cơ chế thêm.
- Chỉ sửa `js/data/q-devops.js`; `js/data/index-light.js` được sinh lại bằng `node scripts/build-light-index.js` theo AGENTS.md §6. Không commit.
- 2026-11-09: xác nhận `js/data/q-devops.js` đã đủ chuẩn cho 6 id (devops-001 đến devops-006): mỗi id có mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được) ngay trước `> Senior tip:`, `### Trả lời miệng 1 phút` thay cho `### Trả lời mẫu khi phỏng vấn` (quy tắc 2), field `follow` 2–3 câu, và đáp án > 3000 ký tự nên không bổ sung phần cơ chế thêm. `node scripts/build-light-index.js` đã sinh lại `js/data/index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.`. Chỉ sửa `js/data/q-devops.js`. Không commit.
