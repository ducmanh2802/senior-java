# T57 — Nội dung: SQL thực hành (viết query)

Status: TODO
Agent: opencode
Owns: `js/data/q-sql.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
File đang rỗng: ID bắt đầu từ `sql-001`.
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `sql`: thêm 14 câu (đang có ~0 → mục tiêu ≥ 14)
- Lương cao thứ N (cao thứ 2) theo phòng ban: subquery, {{DENSE_RANK}}, xử lý trùng lương
- Tìm và xoá bản ghi trùng, chỉ giữ một bản (ROW_NUMBER, DELETE … USING / ctid / ROWID)
- Các loại JOIN và anti-join: khách hàng chưa có giao dịch — {{NOT EXISTS}} vs {{NOT IN}} (bẫy NULL) vs {{LEFT JOIN … IS NULL}}
- WHERE vs HAVING và thứ tự thực thi logic của câu SELECT; lỗi hay gặp khi GROUP BY
- Top N mỗi nhóm: 3 giao dịch lớn nhất của mỗi khách hàng
- Sao kê tài khoản: số dư đầu kỳ, phát sinh nợ/có, số dư cuối kỳ và số dư luỹ kế theo từng giao dịch (window SUM)
- Gaps and islands: tìm chuỗi ngày đăng nhập/giao dịch liên tiếp dài nhất
- Pivot: doanh số theo tháng thành cột ({{SUM(CASE WHEN …)}}), so sánh cùng kỳ năm trước
- Recursive CTE: cây tổ chức / danh mục nhiều cấp, tìm tất cả cấp dưới
- UPSERT: {{INSERT … ON CONFLICT}} (PostgreSQL) và {{MERGE}} (Oracle); race condition khi tự viết select-then-insert
- NULL trong SQL: so sánh, {{COUNT(*)}} vs {{COUNT(col)}} vs {{COUNT(DISTINCT)}}, NULL trong aggregate và ORDER BY
- DELETE vs TRUNCATE vs DROP; view vs materialized view
- Phát hiện giao dịch bất thường: giao dịch lớn hơn 3 lần trung bình 30 ngày trước của chính khách hàng (CTE + window)
- Lọc theo khoảng thời gian đúng cách: nửa mở (>= đầu kỳ AND < đầu kỳ sau), timezone, không bọc hàm quanh cột có index

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
