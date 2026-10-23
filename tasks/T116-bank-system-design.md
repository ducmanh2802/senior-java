# T116 — System design cho ngân hàng / fintech Việt Nam

Status: TODO
Agent: agy
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong file (không trùng). Thêm **6 câu** topic `design` (level senior/lead), mỗi câu 3000–6000 ký tự: yêu cầu & ước lượng tải, API, mô hình dữ liệu, sơ đồ ASCII, luồng chính, nhất quán & lỗi, trade-off, câu hỏi interviewer hay đào:
1. Sổ cái (ledger) bút toán kép cho ví/tài khoản: số dư, không âm, đối soát.
2. Cổng thanh toán chuyển khoản nhanh 24/7 (Napas) với timeout không rõ kết quả và tra soát.
3. Dịch vụ OTP / Smart OTP: sinh, hết hạn, chống brute-force, rate limit.
4. Sinh sao kê tháng cho hàng triệu tài khoản (batch, phân vùng, chạy lại an toàn).
5. Rule engine chống gian lận realtime (luồng sự kiện, độ trễ, false positive).
6. Hệ thống tích điểm loyalty / hoàn tiền (idempotency, hết hạn điểm, đối soát với đối tác).
Không bịa số hiệu quy định; số liệu tải ghi rõ là giả định. Có `refs` nếu chắc link (mục 13). `node scripts/validate.js` → OK.

## Notes
