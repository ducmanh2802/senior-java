# T2786 — 3 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2723

Đã thêm 3 câu hỏi banking-097 (senior), banking-098 (senior), banking-099 (lead) vào `js/data/q-banking.js` trước dòng `);` cuối.

- banking-097: lãi tiết kiệm hàng ngày hàng triệu tài khoản, làm tròn phần dư phân bổ vào kỳ cuối, ngày nghỉ/lễ không tính lãi, job hàng đêm idempotent theo ngày nghiệp vụ. Góc round 3 khác banking-087 (actual/365 cơ bản).
- banking-098: cut-off matrix multi-kênh (NAPAS/RTGS/thẻ quốc tế), holiday cascading, value date vs posting date, cut-off job miss + SLA. Góc round 3 khác banking-088 (cut-off cơ bản).
- banking-099 (lead): core quá tải cascade timeout, circuit breaker half-open, Kafka buffer + rate limit, hàng đợi ưu tiên giao dịch khẩn, DLQ, đối soát real-time middleware log vs core log phát hiện tiền treo. Góc round 3 khác banking-089 (middleware/ESB cơ bản).

Kết quả verify:
- `node --check js/data/q-banking.js` → OK (không lỗi cú pháp)
- `node scripts/validate.js` → không báo lỗi nào cho banking-097/098/099
- Các lỗi còn lại trong validate.js (q-security.js syntax error, index-light.js cũ, lessons-*.js, path.js…) là lỗi cũ trong file KHÔNG sở hữu, không do task này gây ra. `build-light-index.js` crash do `q-security.js:7709` (lỗi cũ, không phải file của task).

Notes: thêm banking-097, banking-098, banking-099 (3 câu, level senior/senior/lead), không trùng ý với banking-087/088/089 (vòng 1) và các câu khác trong file.
Reviewed-by: kilo (T2786R)
