# T1309 — Nâng cấp đáp án q-microservices: microservices-025 … microservices-030

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1294

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-025` (6967 ký tự): thiếu Ví dụ đời thực
- `microservices-026` (7027 ký tự): thiếu Ví dụ đời thực
- `microservices-027` (6245 ký tự): thiếu Ví dụ đời thực
- `microservices-028` (6419 ký tự): thiếu Ví dụ đời thực
- `microservices-029` (5511 ký tự): thiếu Ví dụ đời thực
- `microservices-030` (6509 ký tự): thiếu Ví dụ đời thực

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
- `microservices-025`: thêm `### Ví dụ đời thực` (hệ thống đặt vé 5 service, timeout budget + deadline propagation qua header `x-request-timeout-ms`, zombie request 12%→<0,1%, p99 5s→1,2s). Đã có `### Trả lời miệng 1 phút` và `follow` → không thêm. Sửa heading bị thụt 2 space thành heading đúng.
- `microservices-026`: thêm `### Ví dụ đời thực` (Order Service gọi Payment/Catalog/User, bulkhead semaphore 25/50/50, Payment DB lock 30s, Tomcat 200 thread cạn → fallback partial, Catalog/User vẫn 99,9%). Đã có `Trả lời miệng 1 phút` + `follow`. Sửa heading thụt.
- `microservices-027`: thêm `### Ví dụ đời thực` (15 service chatty/distributed monolith, fan-out 6 hop, shared DB `order_db`, change coupling 48/60 PR → gộp thành `Ordering` + API composition/CQRS, deploy 4→1 service, p99 2,1s→180ms/22ms). Đã có `Trả lời miệng 1 phút` + `follow`.
- `microservices-028`: thêm `### Ví dụ đời thực` (dashboard đơn/khách/thanh toán/tồn kho, Flash Sale 2.500 req/s, gọi tuần tự p99 1,4s → API composition song song + partial response p99 380ms → CQRS read model p99 12–18ms, projection lag p99 ~1,2s, data lake cho BI). Đã có `Trả lời miệng 1 phút` + `follow` + `refs`.
- `microservices-029`: thêm `### Ví dụ đời thực` (topic `order-events` 12 partition, producer không key gây đảo thứ tự `Refunded` trước `PaymentCaptured` ~0,3%/1.200 đơn/tháng → key=`orderId`, idempotent producer, commit offset liên tục, quy trình tăng partition có kế hoạch; lỗi đảo thứ tự về 0). Đã có `Trả lời miệng 1 phút` + `follow` + `refs`.
- `microservices-030`: thêm `### Ví dụ đời thực` (consumer group `order-processor` 6 pod/12 partition, eager rebalance khi deploy/scale → lag 45k–80k, p95 35–60s; chuyển `CooperativeStickyAssignor` rolling 2 bước + StatefulSet `group.instance.id` + tune poll/heartbeat + KEDA theo lag; rebalance ~14→0–2, lag đỉnh <3k). Đã có `Trả lời miệng 1 phút` + `follow` + `refs`.
- Đã chạy `node --check js/data/q-microservices.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → **OK** (chỉ còn warning sẵn có `path.js` 2 bài học ngoài PATH, không phải lỗi). Không sửa file ngoài `js/data/q-microservices.js` và `tasks/T1309-upgrade-microservices-5.md`. Không git commit.
Reviewed-by: kilo (T1309R)
