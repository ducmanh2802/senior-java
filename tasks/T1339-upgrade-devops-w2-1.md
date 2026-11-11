# T1339 — Nâng cấp đáp án q-devops: devops-037 … devops-042

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1326

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-037` (6769 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-038` (5849 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-039` (4603 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-040` (4704 ký tự): thiếu Ví dụ đời thực
- `devops-041` (4052 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-042` (3962 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã thêm cho 6 câu hỏi devops-037 đến devops-042:
- devops-037: thêm `### Ví dụ đời thực` (audit PCI DSS: default-deny NetworkPolicy, ESO, Cilium, flow log) và `### Trả lời mẫu khi phỏng vấn`
- devops-038: thêm `### Ví dụ đời thực` (alert noise 40/tuần → SLO/SLI/burn rate multi-window, page giảm 90%) và `### Trả lời mẫu khi phỏng vấn`
- devops-039: thêm `### Ví dụ đời thực` (scale 1→3 Pod: mất session, file mất, job chạy 3 lần → Spring Session Redis, S3 presigned, ShedLock) và `### Trả lời mẫu khi phỏng vấn`
- devops-040: thêm `### Ví dụ đời thực` (static key ConfigMap → IRSA, least privilege, CloudTrail truy vết, audit pass)
- devops-041: thêm `### Ví dụ đời thực` (Jenkins push-based → Argo CD pull-based, selfHeal, git revert rollback, break-glass) và `### Trả lời mẫu khi phỏng vấn`
- devops-042: thêm `### Ví dụ đời thực` (canary abort oan do JIT lạnh, canary-by-header, pause quên → warmupDurationSecs, 5xx rate, expand-contract migration) và `### Trả lời mẫu khi phỏng vấn`

Tất cả inline code dùng `{{...}}` thay vì backtick để tránh lỗi template literal. q-devops.js pass `node --check`. Các lỗi validate còn lại (lessons-*.js, projects.js, path.js) là pre-existing ở file không thuộc task.
Reviewed-by: kilo (T1339R)
