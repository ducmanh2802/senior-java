# T1601R — Fact-check nội dung mới của T1601

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1601 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- banking-039: Sửa biến `txId` chưa khai báo trong code Java (thêm `String txId = java.util.UUID.randomUUID().toString();`).
- banking-041: Sửa lỗi số liệu: "Lech 200.000.000 VND (200 ty)" → "Lech 200.000.000 VND (200 trieu)" (200 triệu = 0,2 tỷ, không phải 200 tỷ).
- banking-042: Sửa code ví dụ để khớp với tính lãi giảm dần (declining balance) thay vì chia đều tổng lãi; sửa ví dụ số liệu: 591.780,82... làm tròn HALF_UP = 591.781 (không phải 591.780).
- banking-043: Sửa code để insertIfNew và ledgerService.post chạy trong CÙNG một transaction (dùng txTemplate) tránh không nhất quán.
- banking-044: Sửa typo "effect_from" → "effective_from".
