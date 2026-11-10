# T1324 — Nâng cấp đáp án q-microservices: microservices-031 … microservices-036

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1309

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-031` (6020 ký tự): thiếu Ví dụ đời thực
- `microservices-032` (5912 ký tự): thiếu Ví dụ đời thực
- `microservices-033` (6027 ký tự): thiếu Ví dụ đời thực
- `microservices-034` (6319 ký tự): thiếu Ví dụ đời thực
- `microservices-035` (5712 ký tự): thiếu Ví dụ đời thực
- `microservices-036` (5624 ký tự): thiếu Ví dụ đời thực

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
- Đã thêm `### Ví dụ đời thực` (triệu chứng → điều tra lệnh/metric/log cụ thể → nguyên nhân gốc → cách xử lý → kết quả đo được) cho đủ 6 câu: `microservices-031` (at-least-once + inbox idempotency, ví cộng tiền ví trùng sau OOMKilled/restart), `microservices-032` (migration ZooKeeper→KRaft, controller failover chậm + ZooKeeper session timeout), `microservices-033` (chọn sai retention/compaction: audit mất 75 ngày, customer.state phình 180GB), `microservices-034` (poison message deserialize kẹt partition, ErrorHandlingDeserializer + DLT), `microservices-035` (lag tăng do nút thắt DB, batch write + backpressure/pause + KEDA), `microservices-036` (schema evolution Avro, deploy sai thứ tự + BACKWARD non-transitive + đổi nghĩa đơn vị).
- Các câu đã có `### Trả lời miệng 1 phút` tương đương nên không thêm mục trả lời mẫu trùng; đã có `follow` (2 câu/câu) nên không sửa.
- Chèn ngay trước `> Senior tip:` của từng id bằng edit đoạn nhỏ; không ghi lại toàn file, không đụng câu khác. `node --check js/data/q-microservices.js` OK.
- `node scripts/build-light-index.js` và `node scripts/validate.js` hiện FAIL do lỗi **có sẵn, không thuộc file sở hữu**: `q-remote.js` lỗi cú pháp `Unexpected identifier 'log'` (dòng ~2706, backtick/markup vỡ trong template literal) khiến build-light-index không chạy và validate báo lỗi ở `q-remote.js` + `index-light.js` cũ. Phần `q-microservices.js` trong output validate hiển thị bình thường (57 câu hỏi microservices). Cần integrator sửa `q-remote.js` rồi chạy lại `node scripts/build-light-index.js` và `node scripts/validate.js`.
Reviewed-by: kilo (T1324R)
