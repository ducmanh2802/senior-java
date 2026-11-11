# T1376 — Nâng cấp đáp án q-devops: devops-062 … devops-081

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1368

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-062` (6710 ký tự): thiếu Ví dụ đời thực
- `devops-063` (7103 ký tự): thiếu Ví dụ đời thực
- `devops-064` (7637 ký tự): thiếu Ví dụ đời thực
- `devops-075` (7984 ký tự): thiếu Trả lời mẫu
- `devops-080` (4107 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-081` (4309 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `devops-062`: thêm `### Ví dụ đời thực` (triệu chứng OOMKilled/exit 137 trên K8s, điều tra dmesg+kubectl, nguyên nhân RSS vượt limit, xử lý MaxRAMPercentage/alert, kết quả đo được) trước Senior tip. Giữ nguyên nội dung cũ (đã có follow).
- `devops-063`: thêm `### Ví dụ đời thực` (rò file descriptor do Files.lines không try-with-resources, điều tra /proc/<PID>/limits, lsof, metric; xử lý + kết quả). Sửa inline code lồng `{}` trong ví dụ để qua validate.
- `devops-064`: thêm `### Ví dụ đời thực` (SEV1 thanh toán, runbook detect/triage/mitigate, thu thập thread dump/dmesg trước rollback, nguyên nhân lock/connection pool, postmortem, MTTR/impact đo được).
- `devops-075`: thêm `### Ví dụ đời thực` (tổ chức DevOps mơ hồ gây MTTR cao, phân vai SA/Platform/Infra/SRE/Security, kết quả) và `### Trả lời mẫu khi phỏng vấn` (đoạn nói tự nhiên ~160 từ, ngôi thứ nhất) trước Senior tip.
- `devops-080`: thêm `### Ví dụ đời thực` (loan-service failed sau reboot do quyền jar, điều tra systemctl/journalctl/ls -l, xử lý chown/chmod + alert) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip.
- `devops-081`: thêm `### Ví dụ đời thực` (SSH brute-force, điều tra auth.log/sshd -T, hardening khóa+fail2ban+bastion, kết quả) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (chỉ còn cảnh báo có sẵn: lesson-design-007 không nằm trong PATH). Không chạy git. Chỉ sửa `js/data/q-devops.js`, `js/data/index-light.js` (tạo bởi script theo yêu cầu validate) và file task này.
Reviewed-by: kilo (T1376R)
