# T1326 — Nâng cấp đáp án q-devops: devops-031 … devops-036

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1311

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-031` (5794 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-032` (5562 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-033` (5813 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-034` (6295 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-035` (5859 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `devops-036` (5512 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `devops-031`: thêm `### Ví dụ đời thực` (sự cố CVE commons-text/Text4Shell, tra SBOM/Dependency-Track, Audit→Enforce Kyverno, đo thời gian xác định ảnh hưởng và vá). Giữ nguyên nội dung gốc và follow.
- `devops-032`: thêm `### Ví dụ đời thực` (chuyển JDK image sang distroless+jlink, đo kích thước/CVE/pull time, debug qua Actuator/ephemeral) và `### Trả lời mẫu khi phỏng vấn`.
- `devops-033`: thêm `### Ví dụ đời thực` (xung đột state làm "quên" RDS, import khôi phục, chuyển S3 backend+lock+CI plan/apply, giảm drift/rủi ro) và `### Trả lời mẫu khi phỏng vấn`.
- `devops-034`: thêm `### Ví dụ đời thực` (EMFILE/EADDRNOTAVAIL do tạo HttpClient mới mỗi request, chẩn đoán /proc/ss/lsof, refactor client dùng chung+pool, đo fd/TIME_WAIT/5xx) và `### Trả lời mẫu khi phỏng vấn`.
- `devops-035`: thêm `### Ví dụ đời thực` (p99 5s do ndots/search domain + NXDOMAIN + conntrack UDP, chỉnh ndots/NodeLocal DNSCache/CoreDNS/keep-alive, đo NXDOMAIN và p99) và `### Trả lời mẫu khi phỏng vấn`.
- `devops-036`: thêm `### Ví dụ đời thực` (node-pressure eviction payment-api vượt request, phân biệt Evicted vs OOMKilled, đặt request=limit/PriorityClass/VPA recommend, đo eviction/usage-request) và `### Trả lời mẫu khi phỏng vấn`.
- Kiểm tra: `node --check js/data/q-devops.js` OK.
- Không thể chạy `node scripts/build-light-index.js` / đạt `node scripts/validate.js` OK trong workspace hiện tại do lỗi cú pháp pre-existing ở file không thuộc task (ví dụ `lessons-spring.js`, `labs-incident.js`, `lessons-jpa.js`, `lessons-microservices.js`, `lessons-db.js`, `lessons-sql.js`, `lessons-testing.js`, `lessons-devops.js`, `projects.js`) và thiếu lesson/path tham chiếu từ `path.js`; theo luật 3/8-9 không sửa file ngoài phạm vi. `index-light.js` chưa rebuild được vì build-light-index lỗi ở `lessons-spring.js`. تغییر
Reviewed-by: kilo (T1326R)
