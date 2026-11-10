# T1367 — Nâng cấp đáp án q-system-design: architecture-026 … design-030

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1358

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `architecture-026` (5420 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-027` (6546 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-028` (5466 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-029` (5442 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-030` (5115 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-030` (1886 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `architecture-026`: thêm `### Ví dụ đời thực` (triệu chứng/điều tra/nguyên nhân/xử lý/kết quả, case rò rỉ chéo tenant do SQL thô bỏ qua ORM filter, xử lý bằng RLS + test cô lập) và `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, ~180 từ) ngay trước `> Senior tip:`. `follow` đã có đủ, giữ nguyên.
- `architecture-027`: thêm `### Ví dụ đời thực` (ví điện tử event sourcing, aggregate ~60.000 event, p95 2,8s → 150ms nhờ snapshot mỗi 500 event) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có, giữ nguyên.
- `architecture-028`: thêm `### Ví dụ đời thực` (deploy truy vấn thiếu index làm 100% tenant lỗi trên cụm chung; chuyển 20 cell giới hạn blast radius ≈5%) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có, giữ nguyên.
- `architecture-029`: thêm `### Ví dụ đời thực` (hoá đơn AWS $6.2k→$14.8k/tháng, điều tra theo tag/cost per 1.000 orders, giảm ~45% nhờ log tiering+sampling, gộp API/chatty, autoscale+reserved, giữ SLO/HA) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có, giữ nguyên.
- `architecture-030`: thêm `### Ví dụ đời thực` (bế tắc 3 tuần tách service thanh toán; RFC + spike 3 ngày + tiêu chí chốt → quyết định giữ modular monolith, ADR có mốc review, chốt trong 5 ngày) và `### Trả lời mẫu khi phỏng vấn`. `follow` đã có, giữ nguyên.
- `design-030`: mở rộng đáp án (giải thích thuật ngữ at-least-once/ACK/OTP/SLA/provider/dedup/DLQ/jitter/circuit breaker, cơ chế từng bước, pitfall rõ hơn, sequence diagram), thêm `### Ví dụ đời thực` (campaign marketing 1,2M email làm OTP trễ 3–8 phút; tách queue OTP/worker dedicated → 99% OTP < 4s) và `### Trả lời mẫu khi phỏng vấn`. Thêm 1 câu `follow` (fallback khi provider SMS/push lỗi) để đủ 3 câu.
- Chỉ sửa `js/data/q-system-design.js` bằng edit từng đoạn nhỏ quanh `> Senior tip:` từng id; không ghi lại toàn file, không sửa file khác. Không dùng backtick/`${` trong phần thêm.
- Kiểm tra: `node --check js/data/q-system-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo sẵn có `path.js` 2 bài học ngoài PATH; không thuộc task, không sửa).
Reviewed-by: kilo (T1367R)
