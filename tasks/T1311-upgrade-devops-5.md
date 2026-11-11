# T1311 — Nâng cấp đáp án q-devops: devops-025 … devops-030

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1296

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-025` (5993 ký tự): thiếu Ví dụ đời thực
- `devops-026` (5477 ký tự): thiếu Ví dụ đời thực
- `devops-027` (6536 ký tự): thiếu Ví dụ đời thực
- `devops-028` (6801 ký tự): thiếu Ví dụ đời thực
- `devops-029` (6179 ký tự): thiếu Ví dụ đời thực
- `devops-030` (6816 ký tự): thiếu Ví dụ đời thực

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
- devops-025: thêm mục `### Ví dụ đời thực` (sự cố ConfigMap/Secret đổi nhưng Pod cũ giữ env, auth fail 30%, hỗn hợp cấu hình) trước Senior tip.
- devops-026: thêm mục `### Ví dụ đời thực` (hotfix tag latest lệch digest, rollback vô nghĩa, 2/10 Pod lỗi) trước Senior tip; sửa inline code điều tra để tránh dấu ngoặc nhọn lồng nhau trong `{{...}}`.
- devops-027: thêm mục `### Ví dụ đời thực` (build chậm 8 phút, deploy chồng, access key 14 tháng; chuyển OIDC + cache + concurrency) trước Senior tip; sửa inline code concurrency để tránh ngoặc nhọn lồng nhau.
- devops-028: thêm mục `### Ví dụ đời thực` (CronJob tính lãi trùng/lỡ/treo; Forbid, starting/activeDeadline, idempotent) trước Senior tip.
- devops-029: thêm mục `### Ví dụ đời thực` (drain node gây 503, 3 Pod dồn 1 node; thêm topology spread + PDB) trước Senior tip.
- devops-030: thêm mục `### Ví dụ đời thực` (multi-tenant: noisy neighbor, đọc lén secret, Pod privileged; quota/RBAC/NetPol/PSA) trước Senior tip.
- Chỉ sửa `js/data/q-devops.js` và file task này. Follow đã có sẵn cho cả 6 id.
- `node scripts/build-light-index.js` chạy lần đầu ghi được index-light nhưng lần chạy lại sau đó crash do lỗi cú pháp sẵn có ở `q-scenario.js` (ngoài phạm vi sở hữu). `node scripts/validate.js` hiện báo LỖI từ `q-scenario.js` (Unexpected identifier 'fullName') và các lỗi hệ quả (bugs/projects/path tham chiếu scenario-* không load được, index-light cũ) — không phát sinh từ `q-devops.js`. Không sửa file ngoài scope theo luật.
Reviewed-by: kilo (T1311R)
