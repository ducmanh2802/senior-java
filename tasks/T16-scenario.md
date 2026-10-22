# T16 — Nội dung: Tình huống thực tế (production scenarios)

Status: TODO
Agent: opencode
Owns: `js/data/q-scenario.js`

## Mục tiêu
Sưu tầm và viết **≥ 24 câu hỏi tình huống thực tế**, là loại câu mà interviewer Senior/Lead ở Việt Nam và công ty nước ngoài hay hỏi:
"Hệ thống đang gặp X, bạn xử lý thế nào?". Topic `scenario`, ID từ `scenario-001`, theo `AGENTS.md` mục 4–6.
Nếu công cụ của bạn có web search/fetch thì có thể tham khảo thêm các câu phỏng vấn thực tế (blog, Glassdoor, Reddit, Viblo),
nhưng **phải tự viết lại** nội dung, không copy.

### Format đáp án (bắt buộc)
1. `**Tóm tắt:**` hướng xử lý trong 2–3 câu.
2. `### Làm rõ yêu cầu`: những câu nên hỏi lại interviewer (quy mô, SLA, DB gì, có được downtime không…).
3. `### Điều tra / Phân tích`: quy trình chẩn đoán từng bước, kèm công cụ cụ thể.
4. `### Giải pháp`: từ nhanh/tạm thời đến bền vững, có code Java/SQL ngắn nếu cần.
5. `### Trade-off & pitfall`.
6. `> Senior tip:`: kinh nghiệm thực chiến, con số tham khảo.

Độ dài 1500–3500 ký tự. Level phần lớn là `senior`/`lead`.

## Danh sách tình huống (bắt buộc bao phủ, được diễn đạt lại)
### Database & query
- API list đang chạy 5s do một query chậm trên bảng 50 triệu dòng: các bước tối ưu ({{EXPLAIN ANALYZE}}, index, rewrite, cache…)
- Phân trang trang 10.000 rất chậm ({{OFFSET}} lớn) → keyset pagination
- Thêm cột / index vào bảng 200 triệu dòng đang chạy production mà không downtime
- Báo cáo (report) nặng làm chậm DB chính → read replica, materialized view, OLAP/data warehouse
- Lỗi deadlock xuất hiện lúc cao điểm: điều tra & khắc phục
- Connection pool bị cạn ({{Connection is not available, request timed out}}): nguyên nhân & xử lý
- Xoá / archive dữ liệu cũ hàng trăm triệu dòng an toàn
- Hai user cùng cập nhật số dư / tồn kho → race condition, lost update
### File & batch
- **Upload và import file CSV/Excel 1 triệu dòng**: streaming parse (không load hết vào RAM), validate, batch insert, báo lỗi theo dòng, chạy async + báo tiến độ, idempotent khi upload lại
- Export 5 triệu dòng ra CSV cho user tải về mà không OOM (streaming response / async job + S3 presigned URL)
- Upload file lớn (2GB) lên server: multipart / chunk upload, resumable, upload thẳng lên S3 bằng presigned URL, quét virus
- Batch job chạy đêm bị chạy trùng trên nhiều instance (ShedLock, leader election) và mất tiến độ khi crash (checkpoint, Spring Batch)
- Gửi email/notification cho 1 triệu user
### Hiệu năng & sự cố
- API p99 tăng vọt sau khi deploy: quy trình điều tra & rollback
- Service bị OOM / restart liên tục trên Kubernetes
- Memory tăng dần theo ngày (memory leak) trên production
- Gọi API bên thứ ba chậm/không ổn định làm sập hệ thống của mình
- Cache bị stampede khi key hot hết hạn; Redis down thì sao
- Traffic tăng 10 lần trong sự kiện khuyến mãi: chuẩn bị gì
### Tính đúng đắn & tích hợp
- Người dùng bấm "Thanh toán" 2 lần / client retry → bị trừ tiền 2 lần (idempotency)
- Message Kafka bị xử lý trùng hoặc sai thứ tự
- Đồng bộ dữ liệu giữa hệ thống cũ (legacy) và mới trong lúc migrate
- Đối soát (reconciliation) giao dịch với đối tác bị lệch
- Log lộ thông tin nhạy cảm (PII) / secret bị commit lên git: xử lý sự cố bảo mật

### Ngân hàng / fintech (mục tiêu của người học: ngân hàng & big tech Việt Nam), ≥ 6 câu
- Thiết kế ledger kế toán kép (double-entry) cho ví/tài khoản: bảng, ràng buộc, vì sao không update số dư trực tiếp
- Đối soát cuối ngày (end-of-day reconciliation) với NAPAS / đối tác: file đối soát, xử lý giao dịch treo/lệch
- Giao dịch chuyển tiền timeout không rõ kết quả (unknown state): retry, inquiry, compensation
- Audit log & truy vết thay đổi dữ liệu (ai sửa gì, khi nào) đáp ứng yêu cầu kiểm toán / NHNN
- Bảo mật dữ liệu khách hàng: mã hoá at-rest/in-transit, masking, phân quyền, OTP/2FA, PCI DSS cơ bản
- Batch tính lãi/phí cuối ngày cho hàng triệu tài khoản: đúng, chạy lại được (re-runnable), không trùng
- Chịu tải ngày lương / giờ cao điểm: hạn mức, rate limiting, queue

## Notes
(agent ghi chú ở đây)
