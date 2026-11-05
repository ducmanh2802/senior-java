# T618 — 12 câu phỏng vấn nghiệp vụ ngân hàng cho Java dev

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`

Topic **banking** mới (file trống, id banking-001…). Câu hỏi interviewer ở ngân hàng/fintech hỏi dev Java để kiểm tra **hiểu nghiệp vụ**; mỗi đáp án giải thích nghiệp vụ bằng lời thường trước (ví dụ người dùng, số tiền), rồi tới thiết kế kỹ thuật. Level khoảng 3 mid / 7 senior / 2 lead. Gợi ý:
- Core banking là gì, hệ thống xung quanh (kênh số, thẻ, thanh toán, CRM) nói chuyện với core thế nào; vì sao core thường có batch cuối ngày (EOD).
- Chuyển khoản nhanh liên ngân hàng 24/7 (qua NAPAS) ở mức khái niệm; giao dịch timeout xử lý thế nào (tra soát, không tự retry trừ tiền).
- Thiết kế sổ cái kế toán kép cho ví/tài khoản; vì sao append-only.
- Idempotency cho API chuyển tiền và cho callback từ đối tác.
- Đối soát cuối ngày: nguồn lệch, quy trình xử lý.
- Cut-off time, ngày làm việc, ngày lễ ảnh hưởng tới giao dịch và tính lãi.
- Maker-checker (4 mắt), audit trail, phân quyền theo vai trò trong back-office.
- KYC/eKYC và AML ở mức dev cần biết: dữ liệu nào nhạy cảm, lưu và che (masking) thế nào.
- PCI DSS cơ bản khi xử lý số thẻ: không lưu CVV, tokenization, che số thẻ trong log.
- Chuẩn thông điệp ISO 8583 (thẻ) và ISO 20022 (thanh toán) ở mức khái niệm, đúng sự thật, không bịa field.
- Tính lãi tiền gửi/khoản vay trong code: BigDecimal, quy ước ngày (actual/365), làm tròn.
- Xử lý khi core banking bảo trì ban đêm: hàng đợi, store-and-forward, thông báo khách.
Chỗ nào không chắc về quy định cụ thể thì nói chung chung nhưng đúng, không bịa số hiệu văn bản.

- **Sơ đồ:** luồng có nhiều bên (app, service, DB, Kafka, ngân hàng đối tác…) hãy vẽ bằng khối ~~~seq (cú pháp ở AGENTS.md mục 5), mỗi bài/câu/giai đoạn quan trọng ít nhất 1 sơ đồ; validator kiểm tra cú pháp.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-banking.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-banking.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Da them 12 cau hoi moi vao js/data/q-banking.js (topic banking, id banking-001 den banking-012):
- mid (3): banking-001 (core banking + EOD), banking-002 (NAPAS 24/7 + timeout/tra sot), banking-006 (cut-off/ngay lam viec/ngay le)
- senior (7): banking-003 (so cai kep append-only), banking-004 (idempotency API + callback), banking-005 (doi soat cuoi ngay), banking-007 (maker-checker/audit/RBAC), banking-008 (KYC/eKYC/AML/masking), banking-011 (tinh lai BigDecimal actual/365), banking-012 (bao tri ban dem/hang doi/store-and-forward)
- lead (2): banking-009 (PCI DSS/CVV/tokenization), banking-010 (ISO 8583/ISO 20022)
Moi cau co da p ~3500-4500 ky tu, 2-3 cau follow, it nhat 1 so do ~~~seq, khong backtick/`${`. Da chay node --check, build-light-index, validate.js q-banking.js -> OK.
Reviewed-by: kilo (T618R)
