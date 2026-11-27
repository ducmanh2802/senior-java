# T2812R — Fact-check nội dung mới của T2812

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2812 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- banking-104: sửa cờ được bịa trong Logon FIX — "kèm EncClOrdID" không phải trường chuẩn FIX 4.4 (Logon dùng EncryptMethod/HeartBtInt/ResetSeqNumFlag/Username/Password). Đổi thành "kèm heartbeat interval đã thống nhất, số thứ tự bắt đầu".
- banking-105, banking-106, banking-107, banking-108, banking-109: không tìm thấy lỗi kỹ thuật (cờ/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), markup và từ nước ngoài lẫn vào — giữ nguyên.
- `node scripts/validate.js`: không có lỗi nào thuộc `js/data/q-banking.js` (các lỗi còn lại là của file khác, không do task này sở hữu).