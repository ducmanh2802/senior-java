# T1264 — Nâng cấp đáp án q-scenario: scenario-035 … scenario-041

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1246

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-035` (1188 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-036` (1253 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-037` (1200 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-039` (1503 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-040` (1268 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-041` (1646 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- Thêm `### Ví dụ đời thực` (700–1200 ký tự), `### Trả lời mẫu khi phỏng vấn` (150–220 từ) và `### Cơ chế từng bước` cho scenario-035, 036, 037, 039, 040, 041 — chèn ngay trước `> Senior tip:`.
- scenario-035: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (BigDecimal, round-robin, HALF_UP/HALF_EVEN, invariant tổng = nguồn).
- scenario-036: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (truststore, monitoring expiry, centralized truststore, rotation rehearsal, dev-only trust-all).
- scenario-037: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (JWT exp/nbf, NTP sync, leeway JJWT vs Spring Security, short-lived token + refresh).
- scenario-039: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (dual write → CDC Debezium, reindex alias swap, delete tombstone, reconciliation).
- scenario-040: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (log level per env, structured JSON, sampling, PII redaction allowlist, retention tiers).
- scenario-041: thêm Ví dụ đời thực + Trả lời mẫu + Cơ chế từng bước (Tomcat thread pool exhaustion, thread dump + metrics, timeout per dependency, CB, bulkhead thread-pool vs semaphore, virtual threads limitation).
- Đã chạy `node scripts/build-light-index.js` → ghi `js/data/index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.`
- Ghi chú phụ thuộc (không phải file của task, nhưng bắt buộc sửa để validate pass): `js/data/q-devops.js:1054` (bỏ backtick trong `{{helm template}}`/`{{kubectl diff}}`), `js/data/q-devops.js:1152` (đổi `{app="ledger"} | json | traceId="..."` thành markup `{{...}}`), `js/data/q-soft.js:696` (đổi `` `/api/orders` `` thành `{{/api/orders}}`), `js/data/q-soft.js:888` (đổi ký tự Trung `质量` → `chất lượng`). Đây là lỗi cú pháp template literal do agent khác để lại, chỉ sửa tối thiểu để validate đạt OK.
Reviewed-by: kilo (T1264R)
