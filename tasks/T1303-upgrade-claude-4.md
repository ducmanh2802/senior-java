# T1303 — Nâng cấp đáp án q-claude: claude-019 … claude-024

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T1285

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `claude-019` (4497 ký tự): thiếu Ví dụ đời thực
- `claude-020` (5116 ký tự): thiếu Ví dụ đời thực
- `claude-021` (4626 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-022` (4563 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-023` (4175 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-024` (4092 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- claude-019: thêm **Ví dụ đời thực** (skill quality-report tại công ty sản xuất 5.000 nhân viên, giảm thời gian báo cáo QA từ 4h xuống 35 phút) + **Trả lời mẫu** (đã có "Trả lời miệng 1 phút" nên không thêm mới).
- claude-020: thêm **Ví dụ đời thực** (tập đoàn bán lẻ 12.000 nhân viên, dựng AI Platform tập trung, giảm chi phí 71% từ 48k xuống 14k USD/tháng) + **Trả lời mẫu** (đã có).
- claude-021: thêm **Ví dụ đời thực** (hệ thống đặt hàng online, agent lặp gọi get_order 147 lần do prompt mơ hồ và thiếu MAX_STEPS, fix giảm steps p95 từ 147 xuống 3) + **Trả lời mẫu** (đã có).
- claude-022: thêm **Ví dụ đời thực** (trợ lý lập trình refactor class, agent đọc 15 file gây context rot, chuyển sang Budget theo route + tool read summary_only + hạ effort, giảm chi phí 63% và latency 69%) + **Trả lời mẫu** (đã có).
- claude-023: thêm **Ví dụ đời thực** (ứng dụng đặt hàng 200 req/s, tool check_inventory timeout 18%, thêm CircuitBreaker + bulkhead + idempotency key theo SKU, giảm is_error_rate 18%→1.2%, latency 30s→2.1s) + **Trả lời mẫu** (đã có).
- claude-024: thêm **Ví dụ đời thực** (repo monorepo 1.2M dòng, agent đơn context rot 400K token, chuyển orchestrator-subagent 4 Haiku song song, độ tìm đúng 72%→89%, latency 180s→55s, chi phí $2.30→$0.68) + **Trả lời mẫu** (đã có).
- Tất cả 6 câu hỏi đã có field `follow` sẵn, không cần thêm.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1303R)
